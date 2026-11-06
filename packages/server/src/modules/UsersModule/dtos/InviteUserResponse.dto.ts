import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserDto } from './UserResponse.dto';

export class InviteEmailDeliveryDto {
  @ApiProperty({ enum: ['sent', 'offline', 'not_configured', 'failed'] })
  status: 'sent' | 'offline' | 'not_configured' | 'failed';

  @ApiProperty()
  message: string;
}

export class InvitationAccessDetailsDto {
  @ApiProperty()
  email: string;

  @ApiProperty({
    description:
      'One-use invitation link. Share privately; do not log or cache.',
  })
  acceptUrl: string;

  @ApiProperty()
  loginUrl: string;

  @ApiProperty({ example: 24 })
  expiresInHours: number;

  @ApiProperty({ type: InviteEmailDeliveryDto })
  emailDelivery: InviteEmailDeliveryDto;
}

export class InviteUserResponseDto {
  @ApiPropertyOptional({ type: UserDto })
  invitedUser?: UserDto;

  @ApiPropertyOptional({ type: UserDto })
  user?: UserDto;

  @ApiProperty({ type: InvitationAccessDetailsDto })
  invitation: InvitationAccessDetailsDto;

  @ApiProperty()
  message: string;
}
