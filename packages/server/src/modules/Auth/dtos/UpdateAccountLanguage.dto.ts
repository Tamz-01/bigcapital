import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateAccountLanguageDto {
  @ApiProperty({ description: 'Personal display language', enum: ['en', 'ar'] })
  @IsIn(['en', 'ar'])
  language: string;
}
