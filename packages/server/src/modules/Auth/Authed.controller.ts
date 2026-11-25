import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { GetAuthenticatedAccount } from './queries/GetAuthedAccount.service';
import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TenantAgnosticRoute } from '../Tenancy/TenancyGlobal.guard';
import { AuthenticationApplication } from './AuthApplication.sevice';
import { IgnoreUserVerifiedRoute } from './guards/EnsureUserVerified.guard';
import { AuthedAccountResponseDto } from './dtos/AuthedAccountResponse.dto';
import { UpdateAccountLanguageDto } from './dtos/UpdateAccountLanguage.dto';
import { UpdateAccountLanguageService } from './commands/UpdateAccountLanguage.service';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller('/auth')
@ApiTags('Auth')
@ApiExtraModels(AuthedAccountResponseDto)
@TenantAgnosticRoute()
@IgnoreUserVerifiedRoute()
@Throttle({ auth: {} })
export class AuthedController {
  constructor(
    private readonly getAuthedAccountService: GetAuthenticatedAccount,
    private readonly authApp: AuthenticationApplication,
    private readonly updateAccountLanguage: UpdateAccountLanguageService,
  ) {}

  @Post('/signup/verify/resend')
  @ApiOperation({ summary: 'Resend the signup confirmation message' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'resent successfully.' },
      },
    },
  })
  async resendSignupConfirm() {
    await this.authApp.signUpConfirmResend();

    return {
      code: 200,
      message: 'The signup confirmation message has been resent successfully.',
    };
  }

  @Get('/account')
  @ApiOperation({ summary: 'Retrieve the authenticated account' })
  @ApiResponse({
    status: 200,
    description: 'The authenticated account.',
    schema: { $ref: getSchemaPath(AuthedAccountResponseDto) },
  })
  async getAuthedAcccount() {
    return this.getAuthedAccountService.getAccount();
  }

  @Put('/account/language')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update the signed-in user display language' })
  @ApiBody({ type: UpdateAccountLanguageDto })
  @ApiResponse({ status: 200, type: AuthedAccountResponseDto })
  async setAccountLanguage(@Body() dto: UpdateAccountLanguageDto) {
    await this.updateAccountLanguage.execute(dto);
    return this.getAuthedAccountService.getAccount();
  }
}
