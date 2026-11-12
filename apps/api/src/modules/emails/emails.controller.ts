import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BrevoService } from './brevo.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { IsEmail, IsString, IsOptional, IsObject } from 'class-validator';

class SendEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  @IsOptional()
  toName?: string;

  @IsString()
  template: string;

  @IsString()
  lang: 'fr' | 'en' | 'ar';

  @IsObject()
  @IsOptional()
  params?: Record<string, any>;
}

@ApiTags('Emails')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('emails')
export class EmailsController {
  constructor(private readonly brevoService: BrevoService) {}

  @Post('test-connection')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Tester la connexion Brevo (Admin)' })
  async testBrevoConnection() {
    await this.brevoService.testConnection();
    return {
      success: true,
      message: 'Connexion à Brevo réussie',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('send')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Envoyer un email (Admin)' })
  async sendEmail(@Body() dto: SendEmailDto) {
    const result = await this.brevoService.sendEmail({
      ...dto,
      params: dto.params || {},
    });
    return {
      success: true,
      messageId: result.messageId,
      message: 'Email envoyé avec succès',
      timestamp: new Date().toISOString(),
    };
  }
}
