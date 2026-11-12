import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FloatingButtonsService } from './floating-buttons.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateFloatingButtonDto } from './dto/create-floating-button.dto';

@ApiTags('Floating Buttons')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('floating-buttons')
export class FloatingButtonsController {
  constructor(private readonly floatingButtonsService: FloatingButtonsService) {}

  @Get()
  findByRole(@CurrentUser('role') role: Role) {
    return this.floatingButtonsService.findByRole(role);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateFloatingButtonDto) {
    return this.floatingButtonsService.create(dto);
  }
}
