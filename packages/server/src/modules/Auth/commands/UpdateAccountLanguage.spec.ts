import { validate } from 'class-validator';
import { UpdateAccountLanguageDto } from '../dtos/UpdateAccountLanguage.dto';
import { UpdateAccountLanguageService } from './UpdateAccountLanguage.service';

describe('personal language preference', () => {
  it('updates only the authenticated system account, ignoring submitted identity', async () => {
    const patches = [jest.fn(), jest.fn()];
    const accounts = patches.map((patch) => ({ $query: () => ({ patch }) }));
    const context = { getSystemUser: jest.fn().mockResolvedValue(accounts[0]) };
    const service = new UpdateAccountLanguageService(context as any);

    await service.execute({ language: 'ar', userId: 999 } as any);
    expect(patches[0]).toHaveBeenCalledWith({ language: 'ar' });
    expect(patches[1]).not.toHaveBeenCalled();

    context.getSystemUser.mockResolvedValue(accounts[1]);
    await service.execute({ language: 'en' });
    expect(patches[1]).toHaveBeenCalledWith({ language: 'en' });
    expect(patches[0]).toHaveBeenCalledTimes(1);
  });

  it('requires an authenticated account', async () => {
    const service = new UpdateAccountLanguageService({
      getSystemUser: async () => undefined,
    } as any);
    await expect(service.execute({ language: 'en' })).rejects.toThrow();
  });

  it.each(['', 'lo', '../../en', null, undefined])(
    'rejects unsupported language %s',
    async (language) => {
      const dto = Object.assign(new UpdateAccountLanguageDto(), { language });
      expect(await validate(dto)).not.toHaveLength(0);
    },
  );

  it.each(['en', 'ar'])('accepts available language %s', async (language) => {
    const dto = Object.assign(new UpdateAccountLanguageDto(), { language });
    expect(await validate(dto)).toHaveLength(0);
  });
});
