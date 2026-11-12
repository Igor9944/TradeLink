import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Créer une catégorie
   */
  async create(dto: CreateCategoryDto) {
    // Générer le slug si non fourni
    const slug =
      dto.slug ??
      dto.name.fr
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    // Vérifier l'unicité du slug
    const existingSlug = await this.prisma.category.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException('Ce slug existe déjà');
    }

    // Vérifier que le parent existe
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('Catégorie parente introuvable');
      }
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        parentId: dto.parentId,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
    });

    this.logger.log(`Category created: ${category.id} (${category.slug})`);
    return category;
  }

  /**
   * Liste de toutes les catégories (structure hiérarchique)
   */
  async findAll(includeProducts = false) {
    const categories = await this.prisma.category.findMany({
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true, children: true } },
        ...(includeProducts && {
          products: {
            take: 5,
            select: { id: true, name: true, sku: true, priceHT: true },
          },
        }),
      },
      orderBy: { createdAt: 'asc' },
    });

    return categories;
  }

  /**
   * Obtenir l'arbre hiérarchique des catégories
   */
  async getTree() {
    const categories = await this.prisma.category.findMany({
      include: {
        children: {
          include: {
            children: {
              include: {
                _count: { select: { products: true } },
              },
            },
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
      where: { parentId: null }, // Seulement les catégories racines
      orderBy: { name: 'asc' },
    });

    return categories;
  }

  /**
   * Obtenir une catégorie par ID
   */
  async findById(id: string, includeProducts = false) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          select: { id: true, name: true, slug: true },
          orderBy: { name: 'asc' },
        },
        _count: { select: { products: true, children: true } },
        ...(includeProducts && {
          products: {
            where: { isActive: true },
            include: {
              images: { take: 1, orderBy: { position: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
          },
        }),
      },
    });

    if (!category) {
      throw new NotFoundException('Catégorie introuvable');
    }

    return category;
  }

  /**
   * Obtenir une catégorie par slug
   */
  async findBySlug(slug: string, includeProducts = false) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
        ...(includeProducts && {
          products: {
            where: { isActive: true },
            include: {
              images: { take: 1 },
            },
          },
        }),
      },
    });

    if (!category) {
      throw new NotFoundException('Catégorie introuvable');
    }

    return category;
  }

  /**
   * Mettre à jour une catégorie
   */
  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Catégorie introuvable');
    }

    // Vérifier l'unicité du slug si modifié
    if (dto.slug && dto.slug !== category.slug) {
      const existingSlug = await this.prisma.category.findUnique({
        where: { slug: dto.slug },
      });
      if (existingSlug) {
        throw new ConflictException('Ce slug existe déjà');
      }
    }

    // Empêcher une catégorie d'être son propre parent ou un enfant circulaire
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException(
          'Une catégorie ne peut pas être son propre parent',
        );
      }

      // Vérifier que le parent n'est pas un descendant
      const isDescendant = await this.isDescendant(id, dto.parentId);
      if (isDescendant) {
        throw new BadRequestException(
          'Relation circulaire détectée : le parent ne peut pas être un descendant',
        );
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        parentId: dto.parentId,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
    });

    this.logger.log(`Category updated: ${updated.id} (${updated.slug})`);
    return updated;
  }

  /**
   * Supprimer une catégorie
   */
  async delete(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, children: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Catégorie introuvable');
    }

    // Empêcher la suppression si des produits ou sous-catégories existent
    if (category._count.products > 0) {
      throw new BadRequestException(
        `Impossible de supprimer : ${category._count.products} produit(s) lié(s)`,
      );
    }

    if (category._count.children > 0) {
      throw new BadRequestException(
        `Impossible de supprimer : ${category._count.children} sous-catégorie(s) liée(s)`,
      );
    }

    await this.prisma.category.delete({ where: { id } });

    this.logger.log(`Category deleted: ${id}`);
    return { message: 'Catégorie supprimée avec succès' };
  }

  /**
   * Vérifier si une catégorie est un descendant d'une autre
   */
  private async isDescendant(
    categoryId: string,
    potentialAncestorId: string,
  ): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { id: potentialAncestorId },
      select: { parentId: true },
    });

    if (!category) return false;
    if (!category.parentId) return false;
    if (category.parentId === categoryId) return true;

    return this.isDescendant(categoryId, category.parentId);
  }

  /**
   * Obtenir le fil d'Ariane (breadcrumb) d'une catégorie
   */
  async getBreadcrumb(id: string): Promise<any[]> {
    const breadcrumb: any[] = [];
    let currentId: string | null = id;

    while (currentId) {
      const category = await this.prisma.category.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, slug: true, parentId: true },
      });

      if (!category) break;

      breadcrumb.unshift(category);
      currentId = category.parentId;
    }

    return breadcrumb;
  }
}
