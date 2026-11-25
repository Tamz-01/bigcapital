import { Body, Controller, Header, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InviteUserResponseDto } from './dtos/InviteUserResponse.dto';
import { UsersApplication } from './Users.application';
import {
  SendInviteUserDto,
  BulkSendInviteUserDto,
} from './dtos/InviteUser.dto';

@Controller('invite')
@ApiTags('Users')
export class UsersInviteController {
  constructor(private readonly usersApplication: UsersApplication) {}

  /**
   * Send an invitation to a new user.
   */
  @Patch()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Send an invitation to a new user.' })
  @ApiResponse({ status: 200, type: InviteUserResponseDto })
  async sendInvite(@Body() sendInviteDTO: SendInviteUserDto) {
    const result = await this.usersApplication.sendInvite(sendInviteDTO);

    return {
      invitedUser: result.invitedUser,
      invitation: result.invitation,
      message: 'Invitation created. ' + result.invitation.emailDelivery.message,
    };
  }

  /**
   * Resend an invitation to an existing user.
   */
  @Post('users/:id/resend')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Resend an invitation to an existing user.' })
  @ApiResponse({ status: 201, type: InviteUserResponseDto })
  async resendInvite(@Param('id') userId: number) {
    const result = await this.usersApplication.resendInvite(userId);

    return {
      user: result.user,
      invitation: result.invitation,
      message:
        'Invitation regenerated. ' + result.invitation.emailDelivery.message,
    };
  }

  /**
   * Send invitations to multiple users.
   */
  @Post('bulk')
  @ApiOperation({ summary: 'Send invitations to multiple users.' })
  async sendBulkInvites(@Body() bulkSendInviteDTO: BulkSendInviteUserDto) {
    const result =
      await this.usersApplication.sendBulkInvites(bulkSendInviteDTO);

    return {
      invitedUsers: result.invitedUsers,
      failedInvites: result.failedInvites,
      message: 'Bulk invitations processed.',
    };
  }
}
