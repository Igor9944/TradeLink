import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class SendWhatsAppDto {
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

class SendTestWhatsAppDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  @IsIn(['fr', 'en', 'ar'])
  language?: 'fr' | 'en' | 'ar';
}

@ApiTags('WhatsApp')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Post('test-send')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Envoyer un message WhatsApp de test (Admin)' })
  async testWhatsApp(@Body() dto: SendTestWhatsAppDto) {
    const result = await this.whatsAppService.sendTextMessage(
      dto.phoneNumber,
      'TradeLink WhatsApp provider test',
    );
    return {
      success: true,
      message: 'Message WhatsApp de test envoyé avec succès',
      result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('send')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Envoyer un message WhatsApp générique (Admin)' })
  async sendWhatsApp(@Body() dto: SendWhatsAppDto) {
    const result = await this.whatsAppService.sendTextMessage(dto.to, dto.message);
    return {
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    };
  }
}
