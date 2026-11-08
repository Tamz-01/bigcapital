import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as moment from 'moment';
import {
  IUserInvitedEventPayload,
  IUserInviteResendEventPayload,
} from '../Users.types';
import { ERRORS } from '../Users.constants';
import { ServiceError } from '@/modules/Items/ServiceError';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { TenantUser } from '@/modules/Tenancy/TenancyModels/models/TenantUser.model';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import { Role } from '@/modules/Roles/models/Role.model';
import { ModelObject } from 'objection';
import { SendInviteUserDto } from '../dtos/InviteUser.dto';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { ConfigService } from '@nestjs/config';
import { SendInviteUsersMailMessage } from './SendInviteUsersMailMessage.service';
import { InvitationAccessDetails } from './InviteDelivery.types';

@Injectable()
export class InviteTenantUserService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly tenancyContext: TenancyContext,
    private readonly configService: ConfigService,
    private readonly inviteMail: SendInviteUsersMailMessage,

    @Inject(TenantUser.name)
    private readonly tenantUserModel: TenantModelProxy<typeof TenantUser>,

    @Inject(Role.name)
    private readonly roleModel: TenantModelProxy<typeof Role>,
  ) {}

  /**
   * Sends invite mail to the given email from the given tenant and user.
   * @param {string} email -
   * @param {IUser} authorizedUser -
   * @return {Promise<IUserInvite>}
   */
  public async sendInvite(sendInviteDTO: SendInviteUserDto): Promise<{
    invitedUser: TenantUser;
    invitation: InvitationAccessDetails;
  }> {
    // Get the given role or throw not found service error.
    const _role = await this.roleModel().query().findById(sendInviteDTO.roleId);

    // Validates the given email not exists on the storage.
    await this.validateUserEmailNotExists(sendInviteDTO.email);

    // Generates a new invite token.
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // Creates and fetches a tenant user.
    const user = await this.tenantUserModel().query().insertAndFetch({
      email: sendInviteDTO.email,
      roleId: sendInviteDTO.roleId,
      active: true,
      invitedAt: new Date(),
    });

    // Retrieves the authorized user (inviting user).
    const authorizedUser = await this.tenancyContext.getSystemUser();
    const invitingUser = await this.tenantUserModel()
      .query()
      .findOne({ systemUserId: authorizedUser.id });

    // Triggers `onUserSendInvite` event.
    await this.eventEmitter.emitAsync(events.inviteUser.sendInvite, {
      inviteToken,
      user,
      invitingUser,
    } as IUserInvitedEventPayload);

    const invitation = await this.getInvitationAccess(
      user,
      inviteToken,
      invitingUser,
    );
    return { invitedUser: user, invitation };
  }

  /**
   * Re-send user invite.
   * @param {number} tenantId -
   * @param {string} email -
   * @return {Promise<{ invite: IUserInvite }>}
   */
  public async resendInvite(userId: number): Promise<{
    user: ModelObject<TenantUser>;
    invitation: InvitationAccessDetails;
  }> {
    // Retrieve the user by id or throw not found service error.
    const user = await this.getUserByIdOrThrowError(userId);

    // Validate the user is not invited recently.
    this.validateUserInviteThrottle(user);

    // Validate the given user is not accepted yet.
    this.validateInviteUserNotAccept(user);

    // Generates a new invite token.
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // Triggers `onUserSendInvite` event.
    await this.eventEmitter.emitAsync(events.inviteUser.resendInvite, {
      user,
      inviteToken,
    } as IUserInviteResendEventPayload);

    const authorizedUser = await this.tenancyContext.getSystemUser();
    const invitingUser = await this.tenantUserModel()
      .query()
      .findOne({ systemUserId: authorizedUser.id });
    const invitation = await this.getInvitationAccess(
      user,
      inviteToken,
      invitingUser,
    );
    await this.tenantUserModel()
      .query()
      .findById(user.id)
      .patch({ invitedAt: new Date() });
    return { user, invitation };
  }

  private async getInvitationAccess(
    user: ModelObject<TenantUser>,
    inviteToken: string,
    invitingUser: ModelObject<TenantUser>,
  ): Promise<InvitationAccessDetails> {
    const baseUrl = this.configService
      .get<string>('app.baseUrl')
      .replace(/\/$/, '');
    const emailDelivery = await this.inviteMail.deliverInviteMail(
      invitingUser,
      {
        email: user.email,
        token: inviteToken,
      },
    );
    return {
      email: user.email,
      acceptUrl: `${baseUrl}/auth/invite/${inviteToken}/accept`,
      loginUrl: `${baseUrl}/auth/login`,
      expiresInHours: 24,
      emailDelivery,
    };
  }

  /**
   * Validate the given user has no active invite token.
   * @param {number} tenantId
   * @param {number} userId - User id.
   */
  private validateInviteUserNotAccept = (user: ModelObject<TenantUser>) => {
    // Throw the error if the one invite tokens is still active.
    if (user.inviteAcceptedAt) {
      throw new ServiceError(ERRORS.USER_RECENTLY_INVITED);
    }
  };

  /**
   * Validates user invite is not invited recently before specific time point.
   * @param {ITenantUser} user
   */
  private validateUserInviteThrottle = (user: ModelObject<TenantUser>) => {
    const PARSE_FORMAT = 'M/D/YYYY, H:mm:ss A';
    const beforeTime = moment().subtract(5, 'minutes');

    if (moment(user.invitedAt, PARSE_FORMAT).isAfter(beforeTime)) {
      throw new ServiceError(ERRORS.USER_RECENTLY_INVITED);
    }
  };

  /**
   * Retrieve the given user by id or throw not found service error.
   * @param {number} userId - User id.
   */
  private getUserByIdOrThrowError = async (
    userId: number,
  ): Promise<TenantUser> => {
    // Retrieve the tenant user.
    const user = await this.tenantUserModel().query().findById(userId);

    // Throw if the user not found.
    if (!user) {
      throw new ServiceError(ERRORS.USER_NOT_FOUND);
    }
    return user;
  };

  /**
   * Throws error in case the given user email not exists on the storage.
   * @param {string} email
   * @throws {ServiceError}
   */
  private async validateUserEmailNotExists(email: string): Promise<void> {
    const foundUser = await this.tenantUserModel()
      .query()
      .findOne('email', email);

    if (foundUser) {
      throw new ServiceError(ERRORS.EMAIL_EXISTS);
    }
  }
}
