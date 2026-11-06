import { SendInviteUsersMailMessage } from './SendInviteUsersMailMessage.service';
import { createTransport } from 'nodemailer';
import { Mail } from '@/modules/Mail/Mail';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

describe('invitation email delivery', () => {
  const fromUser = {
    firstName: 'Test',
    lastName: 'Owner',
    email: 'owner@example.test',
  } as any;
  const invite = { email: 'member@example.test', token: 'test-token' };
  const sendMail = jest.fn();
  const close = jest.fn();
  const mail = new Mail().setTo(invite.email).setContent('Test invitation');

  function sender(host?: string) {
    const config = {
      get: (key: string) =>
        ({
          'mail.host': host,
          'mail.port': 2525,
          'mail.secure': false,
          'app.baseUrl': 'http://localhost:8080',
        })[key],
    };
    const service = new SendInviteUsersMailMessage(
      { send: jest.fn() } as any,
      {} as any,
      config as any,
    );
    jest.spyOn(service as any, 'buildInviteMail').mockResolvedValue(mail);
    return service;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (createTransport as jest.Mock).mockReturnValue({ sendMail, close });
  });

  it('does not connect or claim success when SMTP is not configured', async () => {
    const result = await sender().deliverInviteMail(fromUser, invite);
    expect(result.status).toBe('not_configured');
    expect(createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('reports offline and preserves manual delivery when the network is unreachable', async () => {
    sendMail.mockRejectedValue(
      Object.assign(new Error('Network unreachable'), { code: 'ENETUNREACH' }),
    );
    const result = await sender('smtp.example.test').deliverInviteMail(
      fromUser,
      invite,
    );
    expect(result.status).toBe('offline');
    expect(result.message).toContain('no internet');
    expect(result.message).toContain('manually');
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('reports authentication failure separately from an offline connection', async () => {
    sendMail.mockRejectedValue(
      Object.assign(new Error('Private server error'), { code: 'EAUTH' }),
    );
    const result = await sender('smtp.example.test').deliverInviteMail(
      fromUser,
      invite,
    );
    expect(result.status).toBe('failed');
    expect(result.message).not.toContain('Private server error');
  });

  it('waits for SMTP acceptance before reporting sent', async () => {
    let accept: (value: unknown) => void;
    sendMail.mockImplementation(
      () =>
        new Promise((resolve) => {
          accept = resolve;
        }),
    );
    const delivery = sender('smtp.example.test').deliverInviteMail(
      fromUser,
      invite,
    );
    await Promise.resolve();
    expect(close).not.toHaveBeenCalled();
    accept!({ accepted: [invite.email] });
    await expect(delivery).resolves.toEqual({
      status: 'sent',
      message: 'Invitation email sent.',
    });
    expect(close).toHaveBeenCalledTimes(1);
  });
});
