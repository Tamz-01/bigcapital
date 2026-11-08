import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateAccountLanguageDto {
  @ApiProperty({
    description: 'Personal display language',
    enum: ['en', 'lo', 'ar'],
  })
  @IsIn(['en', 'lo', 'ar'])
  language: string;
}
