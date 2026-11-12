import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Role, InvoiceStatus } from '@prisma/client';
import { Response } from 'express';

@ApiTags('Invoices')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Roles(Role.SUPPLIER, Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Créer une facture à partir d\'une commande' })
  @ApiResponse({ status: 201, description: 'Facture créée avec succès' })
  @ApiResponse({ status: 400, description: 'Commande invalide ou facture existante' })
  create(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(dto, userId, userRole);
  }

  @Roles(Role.CLIENT, Role.SUPPLIER, Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Liste des factures' })
  @ApiResponse({ status: 200, description: 'Liste paginée des factures' })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Query() pagination: PaginationDto,
    @Query('status') status?: InvoiceStatus,
    @Query('orderId') orderId?: string,
  ) {
    return this.invoicesService.findAll(userId, userRole, pagination, {
      status,
      orderId,
    });
  }

  @Roles(Role.CLIENT, Role.SUPPLIER, Role.ADMIN)
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des factures' })
  @ApiResponse({ status: 200, description: 'Statistiques' })
  getStats(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.invoicesService.getStats(userId, userRole);
  }

  @Roles(Role.CLIENT, Role.SUPPLIER, Role.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une facture par ID' })
  @ApiResponse({ status: 200, description: 'Détails de la facture' })
  @ApiResponse({ status: 404, description: 'Facture introuvable' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.invoicesService.findById(id, userId, userRole);
  }

  @Roles(Role.SUPPLIER, Role.ADMIN)
  @Patch(':id/send')
  @ApiOperation({ summary: 'Marquer une facture comme envoyée' })
  @ApiResponse({ status: 200, description: 'Facture envoyée' })
  markAsSent(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.invoicesService.markAsSent(id, userId, userRole);
  }

  @Roles(Role.CLIENT, Role.SUPPLIER, Role.ADMIN)
  @Get(':id/pdf')
  @ApiOperation({ summary: 'Télécharger la facture en PDF' })
  @ApiResponse({
    status: 200,
    description: 'PDF de la facture',
    content: { 'application/pdf': {} },
  })
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.invoicesService.generatePdf(id, userId, userRole);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}
