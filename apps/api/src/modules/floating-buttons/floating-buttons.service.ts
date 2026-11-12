import { Injectable } from '@nestjs/common';
import { FloatingButtonTarget, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFloatingButtonDto } from './dto/create-floating-button.dto';

@Injectable()
export class FloatingButtonsService {
  constructor(private prisma: PrismaService) {}

  async findByRole(role: Role) {
    const roleTarget: Partial<Record<Role, FloatingButtonTarget>> = {
      [Role.CLIENT]: FloatingButtonTarget.CLIENT,
      [Role.SUPPLIER]: FloatingButtonTarget.SUPPLIER,
      [Role.TRANSPORTER]: FloatingButtonTarget.TRANSPORTER,
      [Role.ACCOUNTANT]: FloatingButtonTarget.ACCOUNTANT,
      [Role.SUPPORT]: FloatingButtonTarget.SUPPORT,
      [Role.ADMIN]: FloatingButtonTarget.ADMIN,
    };
    const targets: FloatingButtonTarget[] = [FloatingButtonTarget.ALL];
    if (roleTarget[role]) targets.push(roleTarget[role]);

    return this.prisma.floatingButton.findMany({
      where: { isActive: true, targetRole: { in: targets } },
      orderBy: { positionOrder: 'asc' },
    });
  }

  async create(dto: CreateFloatingButtonDto) {
    return this.prisma.floatingButton.create({ data: dto });
  }
}
