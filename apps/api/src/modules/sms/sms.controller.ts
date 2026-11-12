import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class SendSmsDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  @IsIn(['fr', 'en', 'ar'])
  language?: 'fr' | 'en' | 'ar';
}

class SendTestSmsDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  @IsIn(['fr', 'en', 'ar'])
  language?: 'fr' | 'en' | 'ar';
}

@ApiTags('SMS')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('test-send')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Envoyer un SMS de test (Admin)' })
  async testSms(@Body() dto: SendTestSmsDto) {
    const result = await this.smsService.sendSMS({
      to: dto.phoneNumber,
      message: 'TradeLink SMS provider test',
    });
    return {
      success: true,
      message: 'SMS de test envoyé avec succès',
      result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('send')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Envoyer un SMS générique (Admin)' })
  async sendSms(@Body() dto: SendSmsDto) {
    const result = await this.smsService.sendSMS({ to: dto.to, message: dto.message });
    return {
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    };
  }
}
