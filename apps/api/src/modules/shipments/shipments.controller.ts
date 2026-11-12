import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { FilterShipmentDto } from './dto/filter-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { AddProofOfDeliveryDto } from './dto/add-proof-of-delivery.dto';

@ApiTags('Shipments')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @Roles(Role.SUPPLIER, Role.ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle mission de transport' })
  create(
    @Body() dto: CreateShipmentDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.shipmentsService.create(dto, userId, userRole);
  }

  @Get()
  @Roles(Role.CLIENT, Role.SUPPLIER, Role.TRANSPORTER, Role.ADMIN)
  @ApiOperation({ summary: 'Lister toutes les missions de transport avec filtres' })
  findAll(
    @Query() filters: FilterShipmentDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.shipmentsService.findAll(filters, userId, userRole);
  }

  @Get(':id')
  @Roles(Role.CLIENT, Role.SUPPLIER, Role.TRANSPORTER, Role.ADMIN)
  @ApiOperation({ summary: 'Récupérer les détails d\'une mission de transport' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.shipmentsService.findOne(id, userId, userRole);
  }

  @Patch(':id/status')
  @Roles(Role.TRANSPORTER, Role.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une expédition' })
  updateStatus(
    @Param('id') id: string, 
    @Body() dto: UpdateShipmentStatusDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.shipmentsService.updateStatus(id, dto, userId, userRole);
  }

  @Post(':id/proof-of-delivery')
  @Roles(Role.TRANSPORTER, Role.ADMIN)
  @ApiOperation({ summary: 'Ajouter une preuve de livraison (photo + signature)' })
  addProofOfDelivery(
    @Param('id') id: string,
    @Body() dto: AddProofOfDeliveryDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.shipmentsService.addProofOfDelivery(id, dto, userId, userRole);
  }

  @Get(':id/tracking')
  @Roles(Role.CLIENT, Role.SUPPLIER, Role.TRANSPORTER, Role.ADMIN)
  @ApiOperation({ summary: 'Récupérer l\'historique de tracking complet' })
  getTrackingHistory(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.shipmentsService.getTrackingHistory(id, userId, userRole);
  }

  @Get('transporter/:transporterId/stats')
  @Roles(Role.TRANSPORTER, Role.ADMIN)
  @ApiOperation({ summary: 'Statistiques des expéditions par transporteur' })
  getTransporterStats(
    @Param('transporterId') transporterId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.shipmentsService.getTransporterStats(transporterId, userId, userRole);
  }
}
