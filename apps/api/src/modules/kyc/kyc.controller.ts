import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { KycService } from './kyc.service';
import { KycScheduler } from './kyc.scheduler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from '@prisma/client';
import { KycStatus } from '@prisma/client';
import { ReviewKycDto } from './dto/review-kyc.dto';

@ApiTags('KYC')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kyc')
export class KycController {
  constructor(
    private readonly kycService: KycService,
    private readonly kycScheduler: KycScheduler,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtenir mon dossier KYC' })
  getMyKyc(@CurrentUser('id') userId: string) {
    return this.kycService.getMyKyc(userId);
  }

  @Post('submit')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Soumettre les documents KYC' })
  submitDocuments(
    @CurrentUser('id') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('documentTypes') documentTypes?: string[],
  ) {
    return this.kycService.submitDocuments(userId, files, documentTypes);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lister tous les dossiers KYC (Admin)' })
  findAll(@Query() pagination: PaginationDto, @Query('status') status?: KycStatus) {
    return this.kycService.getAllKyc(pagination, status);
  }

  @Patch(':id/review')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Approuver ou rejeter un dossier KYC (Admin)' })
  review(
    @Param('id') kycId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ReviewKycDto,
  ) {
    return this.kycService.reviewKyc(kycId, adminId, dto.approved, dto.notes);
  }

  @Get('documents/:documentId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Télécharger un document KYC (Admin)' })
  async getDocument(@Param('documentId') documentId: string) {
    const document = await this.kycService.getDocumentForAdmin(documentId);
    const safeName = document.fileName.replace(/[\r\n"]/g, '_');
    return new StreamableFile(document.contents, {
      type: document.mimeType,
      disposition: `inline; filename="${safeName}"`,
    });
  }

  @Post('cron/test-reminders')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Déclencher manuellement le CRON des rappels KYC (Test/Admin)' })
  async testKycReminders() {
    await this.kycScheduler.handleKycReminders();
    return {
      message: 'CRON des rappels KYC exécuté manuellement avec succès',
      timestamp: new Date().toISOString(),
    };
  }
}
