import { Controller, Get, Patch, Body, Param, UseGuards, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { UserListQueryDto } from './dto/user-list-query.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lister tous les utilisateurs (Admin)' })
  findAll(@Query() query: UserListQueryDto) {
    return this.usersService.findAll(query, {
      role: query.role,
      status: query.status,
      search: query.search,
    });
  }

  @Get('me')
  @ApiOperation({ summary: "Profil de l'utilisateur connecté" })
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findMe(userId);
  }

  @Get('me/sessions')
  @ApiOperation({ summary: "Sessions actives de l'utilisateur connecté" })
  getMySessions(@CurrentUser('id') userId: string) {
    return this.usersService.getSessions(userId);
  }

  @Delete('me/sessions/:sessionId')
  @ApiOperation({ summary: 'Révoquer une session' })
  revokeSession(@CurrentUser('id') userId: string, @Param('sessionId') sessionId: string) {
    return this.usersService.revokeSession(userId, sessionId);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtenir un utilisateur par ID (Admin)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un utilisateur (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Suspendre ou réactiver un utilisateur (Admin)' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, actorId, dto.status);
  }
}
