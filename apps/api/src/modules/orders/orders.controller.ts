import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { Role } from '@prisma/client';

@ApiTags('Orders')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(Role.CLIENT, Role.SUPPLIER, Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Liste des commandes' })
  @ApiResponse({ status: 200, description: 'Liste paginée des commandes' })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Query() pagination: PaginationDto,
    @Query() filters: FilterOrderDto,
  ) {
    return this.ordersService.findAll(userId, userRole, pagination, filters);
  }

  @Roles(Role.CLIENT)
  @Post()
  @ApiOperation({ summary: 'Créer une commande' })
  @ApiResponse({ status: 201, description: 'Commande créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou stock insuffisant' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(userId, dto);
  }

  @Roles(Role.CLIENT, Role.SUPPLIER, Role.ADMIN)
  @Get('summary')
  @ApiOperation({ summary: 'Résumé des commandes' })
  @ApiResponse({ status: 200, description: 'Statistiques des commandes' })
  getSummary(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.ordersService.getSummary(userId, userRole);
  }

  @Roles(Role.CLIENT, Role.SUPPLIER, Role.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une commande par ID' })
  @ApiResponse({ status: 200, description: 'Détails de la commande' })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.ordersService.findById(id, userId, userRole);
  }

  @Roles(Role.CLIENT, Role.SUPPLIER, Role.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une commande (avant confirmation)' })
  @ApiResponse({ status: 200, description: 'Commande mise à jour' })
  @ApiResponse({ status: 400, description: 'Commande déjà confirmée' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, userId, userRole, dto);
  }

  @Roles(Role.CLIENT, Role.SUPPLIER, Role.ADMIN)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Changer le statut d\'une commande' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  @ApiResponse({ status: 400, description: 'Transition invalide' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, userId, userRole, dto);
  }

  @Roles(Role.CLIENT, Role.SUPPLIER, Role.ADMIN)
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Annuler une commande' })
  @ApiResponse({ status: 200, description: 'Commande annulée' })
  @ApiResponse({ status: 400, description: 'Annulation impossible' })
  cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() body?: { reason?: string },
  ) {
    return this.ordersService.cancel(id, userId, userRole, body?.reason);
  }
}
