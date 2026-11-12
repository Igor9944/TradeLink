import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { UpdateProductStockDto } from './dto/update-product-stock.dto';
import { Role } from '@prisma/client';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liste des produits' })
  @ApiResponse({ status: 200, description: 'Liste paginée des produits' })
  findAll(
    @Query() query: FilterProductDto,
  ) {
    return this.productsService.findAll(query, query);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPPLIER, Role.ADMIN)
  @Get('manage')
  @ApiOperation({ summary: 'Liste des produits gérables par le compte connecté' })
  findManageable(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Query() query: FilterProductDto,
  ) {
    return this.productsService.findManageable(
      query,
      query,
      userId,
      userRole,
    );
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPPLIER, Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Créer un produit' })
  @ApiResponse({ status: 201, description: 'Produit créé avec succès' })
  @ApiResponse({ status: 409, description: 'SKU ou slug déjà existant' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(userId, dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un produit par ID' })
  @ApiResponse({ status: 200, description: 'Détails du produit' })
  @ApiResponse({ status: 404, description: 'Produit introuvable' })
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPPLIER, Role.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un produit' })
  @ApiResponse({ status: 200, description: 'Produit mis à jour' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Produit introuvable' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, userId, userRole, dto);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPPLIER, Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un produit (soft delete)' })
  @ApiResponse({ status: 200, description: 'Produit supprimé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.productsService.delete(id, userId, userRole);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPPLIER, Role.ADMIN)
  @Patch(':id/stock')
  @ApiOperation({ summary: 'Mettre à jour le stock d\'un produit' })
  @ApiResponse({ status: 200, description: 'Stock mis à jour' })
  updateStock(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: UpdateProductStockDto,
  ) {
    return this.productsService.updateStock(id, userId, userRole, dto);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPPLIER, Role.ADMIN)
  @Get('alerts/low-stock')
  @ApiOperation({ summary: 'Produits en alerte stock' })
  @ApiResponse({ status: 200, description: 'Liste des produits en alerte' })
  getLowStock(@CurrentUser('id') userId: string, @CurrentUser('role') role: Role) {
    const supplierId = role === Role.SUPPLIER ? userId : undefined;
    return this.productsService.getLowStockProducts(supplierId);
  }
}
