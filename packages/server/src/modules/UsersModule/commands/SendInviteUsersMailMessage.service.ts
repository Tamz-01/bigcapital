import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelObject } from 'objection';
import { Mail } from '@/modules/Mail/Mail';
import { MailTransporter } from '@/modules/Mail/MailTransporter.service';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { UserInvite } from '../models/InviteUser.model';
import { TenantUser } from '@/modules/Tenancy/TenancyModels/models/TenantUser.model';
import { createTransport } from 'nodemailer';
import { InviteEmailDelivery } from './InviteDelivery.types';

@Injectable()
export class SendInviteUsersMailMessage {
  constructor(
    private readonly mailTransporter: MailTransporter,
    private readonly tenancyContext: TenancyContext,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Sends invite mail to the given email.
   * @param {ModelObject<TenantUser>} user
   * @param {ModelObject<UserInvite>} invite
   */
  async sendInviteMail(
    fromUser: ModelObject<TenantUser>,
    invite: Pick<ModelObject<UserInvite>, 'email' | 'token'>,
  ) {
    const mail = await this.buildInviteMail(fromUser, invite);
    return this.mailTransporter.send(mail);
  }

  /** A local invitation remains usable whether or not SMTP is available. */
  async deliverInviteMail(
    fromUser: ModelObject<TenantUser>,
    invite: Pick<ModelObject<UserInvite>, 'email' | 'token'>,
  ): Promise<InviteEmailDelivery> {
    const host = this.configService.get<string>('mail.host')?.trim();
    if (!host) {
      return {
        status: 'not_configured',
        message:
          'Email not sent: outgoing email is not configured. Share the invitation link manually.',
      };
    }
    const username = this.configService.get<string>('mail.username');
    // Use a separate, bounded SMTP connection for this interactive operation.
    // Nothing is queued for a later retry or reported as sent before SMTP accepts it.
    const transporter = createTransport({
      host,
      port: this.configService.get<number>('mail.port'),
      secure: this.configService.get<boolean>('mail.secure'),
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 8000,
      dnsTimeout: 4000,
      ...(username
        ? {
            auth: {
              user: username,
              pass: this.configService.get<string>('mail.password'),
            },
          }
        : {}),
    });
    try {
      const mail = await this.buildInviteMail(fromUser, invite);
      await transporter.sendMail(mail.mailOptions);
      return { status: 'sent', message: 'Invitation email sent.' };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      const offline =
        typeof code === 'string' &&
        [
          'ENETUNREACH',
          'ENETDOWN',
          'EHOSTUNREACH',
          'EAI_AGAIN',
          'ENOTFOUND',
          'ECONNREFUSED',
          'ETIMEDOUT',
          'ESOCKET',
          'ECONNECTION',
        ].includes(code);
      return {
        status: offline ? 'offline' : 'failed',
        message: offline
          ? 'Email not sent: no internet connection or email server unavailable. Share the invitation link manually.'
          : 'Email delivery failed. Check the outgoing email settings or share the invitation link manually.',
      };
    } finally {
      transporter.close();
    }
  }

  private async buildInviteMail(
    fromUser: ModelObject<TenantUser>,
    invite: Pick<ModelObject<UserInvite>, 'email' | 'token'>,
  ): Promise<Mail> {
    const tenant = await this.tenancyContext.getTenant(true);
    const root = path.join(global.__images_dirname, '/bigcapital.png');
    const baseURL = this.configService.get('app.baseUrl');

    return new Mail()
      .setSubject(`${fromUser.firstName} has invited you to join a Bigcapital`)
      .setView('mail/UserInvite.html')
      .setTo(invite.email)
      .setAttachments([
        {
          filename: 'bigcapital.png',
          path: root,
          cid: 'bigcapital_logo',
        },
      ])
      .setData({
        root,
        acceptUrl: `${baseURL}/auth/invite/${invite.token}/accept`,
        fullName: `${fromUser.firstName} ${fromUser.lastName}`,
        firstName: fromUser.firstName,
        lastName: fromUser.lastName,
        email: fromUser.email,
        organizationName: tenant.metadata.name,
      });
  }
}
