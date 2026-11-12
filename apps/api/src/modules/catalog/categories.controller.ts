import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
  ApiQuery,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Role } from '@prisma/client';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liste des catégories' })
  @ApiQuery({
    name: 'includeProducts',
    required: false,
    type: Boolean,
    description: 'Inclure les produits dans les catégories',
  })
  @ApiResponse({ status: 200, description: 'Liste des catégories' })
  findAll(@Query('includeProducts') includeProducts?: string) {
    const include = includeProducts === 'true';
    return this.categoriesService.findAll(include);
  }

  @Public()
  @Get('tree')
  @ApiOperation({
    summary: 'Arbre hiérarchique des catégories',
    description: 'Retourne toutes les catégories organisées en arbre',
  })
  @ApiResponse({ status: 200, description: 'Arbre des catégories' })
  getTree() {
    return this.categoriesService.getTree();
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPLIER)
  @Post()
  @ApiOperation({ summary: 'Créer une catégorie' })
  @ApiResponse({ status: 201, description: 'Catégorie créée avec succès' })
  @ApiResponse({ status: 409, description: 'Slug déjà existant' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une catégorie par ID' })
  @ApiQuery({
    name: 'includeProducts',
    required: false,
    type: Boolean,
    description: 'Inclure les produits',
  })
  @ApiResponse({ status: 200, description: 'Détails de la catégorie' })
  @ApiResponse({ status: 404, description: 'Catégorie introuvable' })
  findOne(
    @Param('id') id: string,
    @Query('includeProducts') includeProducts?: string,
  ) {
    const include = includeProducts === 'true';
    return this.categoriesService.findById(id, include);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Obtenir une catégorie par slug' })
  @ApiQuery({
    name: 'includeProducts',
    required: false,
    type: Boolean,
    description: 'Inclure les produits',
  })
  @ApiResponse({ status: 200, description: 'Détails de la catégorie' })
  @ApiResponse({ status: 404, description: 'Catégorie introuvable' })
  findBySlug(
    @Param('slug') slug: string,
    @Query('includeProducts') includeProducts?: string,
  ) {
    const include = includeProducts === 'true';
    return this.categoriesService.findBySlug(slug, include);
  }

  @Public()
  @Get(':id/breadcrumb')
  @ApiOperation({ summary: 'Obtenir le fil d\'Ariane d\'une catégorie' })
  @ApiResponse({ status: 200, description: 'Fil d\'Ariane de la catégorie' })
  getBreadcrumb(@Param('id') id: string) {
    return this.categoriesService.getBreadcrumb(id);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une catégorie' })
  @ApiResponse({ status: 200, description: 'Catégorie mise à jour' })
  @ApiResponse({ status: 404, description: 'Catégorie introuvable' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une catégorie' })
  @ApiResponse({ status: 200, description: 'Catégorie supprimée' })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer (produits ou sous-catégories liés)',
  })
  delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
