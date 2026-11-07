import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { UpdateAccountLanguageDto } from '../dtos/UpdateAccountLanguage.dto';

@Injectable()
export class UpdateAccountLanguageService {
  constructor(private readonly tenancyContext: TenancyContext) {}

  async execute(dto: UpdateAccountLanguageDto): Promise<void> {
    // Resolve the identity from authentication, never from a submitted user ID.
    const user = await this.tenancyContext.getSystemUser();
    if (!user) {
      throw new UnauthorizedException();
    }
    await user.$query().patch({ language: dto.language });
  }
}
