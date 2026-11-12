import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PaginationDto,
  getPaginationParams,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { UpdateProductStockDto } from './dto/update-product-stock.dto';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Créer un nouveau produit avec images, traductions et variantes
   */
  async create(supplierId: string, dto: CreateProductDto) {
    // Vérifier que le SKU est unique
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new ConflictException('Ce SKU existe déjà');
    }

    // Générer le slug si non fourni
    const slug =
      dto.slug ??
      `${dto.sku}-${dto.name.fr}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    // Vérifier l'unicité du slug
    const existingSlug = await this.prisma.product.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException('Ce slug existe déjà');
    }

    // Vérifier que la catégorie existe
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Catégorie introuvable');
      }
    }

    // Créer le produit avec toutes ses relations
    const product = await this.prisma.product.create({
      data: {
        supplierId,
        sku: dto.sku,
        name: dto.name,
        slug,
        categoryId: dto.categoryId,
        priceHT: dto.priceHT,
        taxRate: dto.taxRate ?? 0.19,
        stockQuantity: dto.stockQuantity ?? 0,
        stockAlertLevel: dto.stockAlertLevel ?? 10,
        unit: dto.unit,
        isActive: dto.isActive ?? true,
        isPublic: dto.isPublic ?? false,
        // Créer les images
        images: dto.images
          ? {
              createMany: {
                data: dto.images.map((img, idx) => ({
                  url: img.url,
                  altText: img.altText ?? null,
                  position: img.position ?? idx,
                })),
              },
            }
          : undefined,
        // Créer les traductions
        translations: dto.translations
          ? {
              createMany: {
                data: dto.translations.map((t) => ({
                  lang: t.lang,
                  description: t.description,
                  specs: t.specs,
                })),
              },
            }
          : undefined,
        // Créer les variantes
        variants: dto.variants
          ? {
              create: dto.variants.map((v) => ({
                name: v.name,
                sku: v.sku,
                priceHT: v.priceHT,
                stockQuantity: v.stockQuantity,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        translations: true,
        variants: true,
        supplier: { select: { id: true, email: true, displayName: true } },
      },
    });

    this.logger.log(`Product created: ${product.id} (${product.sku})`);
    return product;
  }

  /**
   * Liste des produits avec filtres et pagination
   */
  async findAll(
    pagination: PaginationDto,
    filters?: FilterProductDto,
    userId?: string,
    userRole?: string,
  ) {
    const { skip, take } = getPaginationParams(pagination);

    // Construire les conditions de filtrage
    const where: Prisma.ProductWhereInput = {};

    if (filters?.search) {
      // Recherche dans SKU ou nom (JSON)
      where.OR = [
        { sku: { contains: filters.search, mode: 'insensitive' } },
        {
          name: {
            path: ['fr'],
            string_contains: filters.search,
          },
        },
        {
          name: {
            path: ['en'],
            string_contains: filters.search,
          },
        },
        {
          name: {
            path: ['ar'],
            string_contains: filters.search,
          },
        },
      ];
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.priceHT = {};
      if (filters.minPrice !== undefined) {
        where.priceHT.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.priceHT.lte = filters.maxPrice;
      }
    }

    if (filters?.inStock) {
      where.stockQuantity = { gt: 0 };
    }

    // Handle lowStock with raw query (field-to-field comparison)
    if (filters?.lowStock) {
      // Use raw SQL for field-to-field comparison since Prisma doesn't support it directly
      const lowStockWhere = { ...where };
      delete lowStockWhere.stockQuantity; // Remove the dummy filter

      const baseWhere = Object.entries(lowStockWhere)
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            const conditions = Object.entries(value)
              .map(([op, val]) => `"${key}" ${this.mapOp(op)} ${this.formatValue(val)}`)
              .join(' AND ');
            return conditions;
          }
          return `"${key}" = ${this.formatValue(value)}`;
        })
        .filter(Boolean)
        .join(' AND ');

      const whereClause = baseWhere
        ? `${baseWhere} AND "stockQuantity" <= "stockAlertLevel" AND "stockQuantity" > 0`
        : '"stockQuantity" <= "stockAlertLevel" AND "stockQuantity" > 0';

      const [data, total] = await Promise.all([
        this.prisma.$queryRaw`
          SELECT p.*,
            json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category,
            json_agg(DISTINCT json_build_object('id', i.id, 'url', i.url, 'altText', i."altText", 'position', i.position) ORDER BY i.position) FILTER (WHERE i.id IS NOT NULL) as images,
            json_build_object('id', s.id, 'displayName', s."displayName") as supplier,
            json_agg(DISTINCT json_build_object('id', v.id, 'name', v.name, 'sku', v.sku)) FILTER (WHERE v.id IS NOT NULL) as variants,
            json_build_object('variants', COUNT(DISTINCT v.id), 'images', COUNT(DISTINCT i.id)) as "_count"
          FROM "Product" p
          LEFT JOIN "Category" c ON p."categoryId" = c.id
          LEFT JOIN "ProductImage" i ON i."productId" = p.id
          LEFT JOIN "User" s ON p."supplierId" = s.id
          LEFT JOIN "ProductVariant" v ON v."productId" = p.id
          WHERE ${Prisma.raw(whereClause)}
          ${filters?.supplierId ? Prisma.raw(`AND p."supplierId" = '${filters.supplierId}'`) : Prisma.empty}
          ${userRole !== 'ADMIN' && userRole !== 'SUPPLIER' ? Prisma.raw(`AND p."isActive" = true AND p."isPublic" = true`) : Prisma.empty}
          GROUP BY p.id, c.id, s.id
          ORDER BY p."createdAt" DESC
          LIMIT ${take} OFFSET ${skip}
        `,
        this.prisma.$queryRaw`
          SELECT COUNT(DISTINCT p.id) as count
          FROM "Product" p
          WHERE ${Prisma.raw(whereClause)}
          ${filters?.supplierId ? Prisma.raw(`AND p."supplierId" = '${filters.supplierId}'`) : Prisma.empty}
          ${userRole !== 'ADMIN' && userRole !== 'SUPPLIER' ? Prisma.raw(`AND p."isActive" = true AND p."isPublic" = true`) : Prisma.empty}
        `,
      ]);

      return buildPaginatedResponse(data as any, Number(total[0]?.count || 0), pagination);
    }

    // Si l'utilisateur n'est pas admin/supplier, afficher uniquement les produits publics et actifs
    if (userRole !== 'ADMIN' && userRole !== 'SUPPLIER') {
      where.isActive = true;
      where.isPublic = true;
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take,
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: {
            orderBy: { position: 'asc' },
            take: 1, // Première image seulement pour la liste
          },
          supplier: { select: { id: true, displayName: true } },
          variants: { select: { id: true, name: true, sku: true } },
          _count: { select: { variants: true, images: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, pagination);
  }

  async findManageable(
    pagination: PaginationDto,
    filters: FilterProductDto,
    userId: string,
    userRole: Role,
  ) {
    return this.findAll(
      pagination,
      {
        ...filters,
        ...(userRole === Role.SUPPLIER ? { supplierId: userId } : {}),
      },
      userId,
      userRole,
    );
  }

  /**
   * Obtenir un produit par ID avec toutes ses relations
   */
  async findById(id: string, userId?: string, userRole?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        translations: true,
        variants: { orderBy: { name: 'asc' } },
        supplier: {
          select: { id: true, email: true, phone: true, displayName: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }

    // Vérifier les permissions
    if (
      (!product.isPublic || !product.isActive) &&
      userRole !== Role.ADMIN &&
      product.supplierId !== userId
    ) {
      throw new ForbiddenException(
        'Vous n\'avez pas accès à ce produit',
      );
    }

    return product;
  }

  /**
   * Obtenir un produit par SKU
   */
  async findBySku(sku: string) {
    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        variants: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }

    return product;
  }

  /**
   * Mettre à jour un produit
   */
  async update(
    id: string,
    userId: string,
    userRole: string,
    dto: UpdateProductDto,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }

    // Seul le fournisseur propriétaire ou l'admin peut modifier
    if (product.supplierId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Vous n\'avez pas le droit de modifier ce produit',
      );
    }

    // Vérifier l'unicité du SKU si modifié
    if (dto.sku && dto.sku !== product.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (existingSku) {
        throw new ConflictException('Ce SKU existe déjà');
      }
    }

    // Vérifier l'unicité du slug si modifié
    if (dto.slug && dto.slug !== product.slug) {
      const existingSlug = await this.prisma.product.findUnique({
        where: { slug: dto.slug },
      });
      if (existingSlug) {
        throw new ConflictException('Ce slug existe déjà');
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        sku: dto.sku,
        name: dto.name,
        slug: dto.slug,
        categoryId: dto.categoryId,
        priceHT: dto.priceHT,
        taxRate: dto.taxRate,
        stockQuantity: dto.stockQuantity,
        stockAlertLevel: dto.stockAlertLevel,
        unit: dto.unit,
        isActive: dto.isActive,
        isPublic: dto.isPublic,
      },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        translations: true,
        variants: true,
      },
    });

    this.logger.log(`Product updated: ${updated.id} (${updated.sku})`);
    return updated;
  }

  /**
   * Supprimer un produit (soft delete en désactivant)
   */
  async delete(id: string, userId: string, userRole: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }

    // Seul le fournisseur propriétaire ou l'admin peut supprimer
    if (product.supplierId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Vous n\'avez pas le droit de supprimer ce produit',
      );
    }

    // Soft delete : désactiver le produit
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false, isPublic: false },
    });

    this.logger.log(`Product deleted (soft): ${id}`);
    return { message: 'Produit supprimé avec succès' };
  }

  /**
   * Mettre à jour le stock d'un produit
   */
  async updateStock(
    id: string,
    userId: string,
    userRole: Role,
    dto: UpdateProductStockDto,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }

    if (product.supplierId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier ce stock');
    }

    const where: Prisma.ProductWhereInput = { id };
    const data: Prisma.ProductUpdateManyMutationInput = {};

    if (dto.operation === 'set') {
      data.stockQuantity = dto.quantity;
    } else if (dto.operation === 'add') {
      data.stockQuantity = { increment: dto.quantity };
    } else {
      where.stockQuantity = { gte: dto.quantity };
      data.stockQuantity = { decrement: dto.quantity };
    }

    const result = await this.prisma.product.updateMany({ where, data });
    if (result.count !== 1) {
      throw new BadRequestException('Stock insuffisant');
    }
    const updated = await this.prisma.product.findUniqueOrThrow({ where: { id } });

    // Vérifier le seuil d'alerte
    if (updated.stockQuantity <= updated.stockAlertLevel) {
      this.logger.warn(
        `Stock alert for product ${updated.id}: ${updated.stockQuantity} <= ${updated.stockAlertLevel}`,
      );
      // TODO: Envoyer une notification au fournisseur
    }

    return updated;
  }

  /**
   * Obtenir les produits en alerte stock
   */
  async getLowStockProducts(supplierId?: string) {
    const conditions = ['p."isActive" = true', 'p."stockQuantity" <= p."stockAlertLevel"', 'p."stockQuantity" > 0'];
    if (supplierId) {
      conditions.push(`p."supplierId" = '${supplierId}'`);
    }
    const whereClause = conditions.join(' AND ');

    return this.prisma.$queryRaw`
      SELECT p.*,
        json_build_object('id', s.id, 'displayName', s."displayName", 'email', s.email) as supplier
      FROM "Product" p
      LEFT JOIN "User" s ON p."supplierId" = s.id
      WHERE ${Prisma.raw(whereClause)}
      ORDER BY p."stockQuantity" ASC
    `;
  }

  private mapOp(op: string): string {
    switch (op) {
      case 'gte': return '>=';
      case 'lte': return '<=';
      case 'gt': return '>';
      case 'lt': return '<';
      case 'equals': return '=';
      case 'contains': return 'ILIKE';
      default: return '=';
    }
  }

  private formatValue(val: any): string {
    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (val === null || val === undefined) return 'NULL';
    return String(val);
  }
}
