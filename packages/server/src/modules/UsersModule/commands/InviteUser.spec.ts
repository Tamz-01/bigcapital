import { InviteTenantUserService } from './InviteUser.service';

describe('manual invitation access', () => {
  it('returns a one-use access link when outgoing email is unavailable', async () => {
    const user = { id: 42, email: 'member@example.test', roleId: 2 };
    const owner = { id: 1, email: 'owner@example.test' };
    const query = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(owner),
      insertAndFetch: jest.fn().mockResolvedValue(user),
    };
    const userModel = () => ({ query: () => query });
    const roleModel = () => ({
      query: () => ({ findById: jest.fn().mockResolvedValue({ id: 2 }) }),
    });
    const emitter = { emitAsync: jest.fn().mockResolvedValue([]) };
    const tenancy = { getSystemUser: jest.fn().mockResolvedValue({ id: 1 }) };
    const config = { get: jest.fn().mockReturnValue('http://localhost:8080/') };
    const delivery = {
      status: 'not_configured',
      message: 'Email not configured.',
    };
    const mail = { deliverInviteMail: jest.fn().mockResolvedValue(delivery) };
    const service = new InviteTenantUserService(
      emitter as any,
      tenancy as any,
      config as any,
      mail as any,
      userModel as any,
      roleModel as any,
    );

    const result = await service.sendInvite({ email: user.email, roleId: 2 });

    expect(result.invitedUser).toEqual(user);
    expect(result.invitation.emailDelivery).toEqual(delivery);
    expect(result.invitation.acceptUrl).toMatch(
      /^http:\/\/localhost:8080\/auth\/invite\/[a-f0-9]{64}\/accept$/,
    );
    expect(result.invitation.loginUrl).toBe('http://localhost:8080/auth/login');
    expect(result.invitation.expiresInHours).toBe(24);
    expect(result.invitation).not.toHaveProperty('password');
    expect(emitter.emitAsync).toHaveBeenCalledTimes(1);
    // The exact token persisted by the existing invitation event is the one shared.
    const persistedToken = emitter.emitAsync.mock.calls[0][1].inviteToken;
    expect(result.invitation.acceptUrl).toContain(persistedToken);
  });
});
