import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, RoomStatus } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateRoomMessageDto } from './dto/create-room-message.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdateRoomNotesDto } from './dto/update-room-notes.dto';
import { RoomsService } from './rooms.service';

@ApiTags('Rooms')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une salle et émettre un lien privé et un code' })
  create(
    @CurrentUser('id') hostId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: CreateRoomDto,
  ) {
    return this.roomsService.create(hostId, role, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les salles accessibles au compte courant' })
  findMine(
    @CurrentUser('id') userId: string,
  ) {
    return this.roomsService.findMine(userId);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lister les métadonnées des salles pour l’administration' })
  findAll() {
    return this.roomsService.findAll();
  }

  @Post('join')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Demander à rejoindre une salle par code ou lien privé' })
  join(
    @CurrentUser('id') userId: string,
    @Body() dto: JoinRoomDto,
  ) {
    return this.roomsService.join(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Afficher une salle après authentification et admission' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.roomsService.findById(id, userId);
  }

  @Patch(':id')
  updateRoom(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.updateRoom(id, userId, dto);
  }

  @Post(':id/invitations/rotate')
  rotateInvite(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.roomsService.rotateInvite(id, userId);
  }

  @Patch(':id/participants/:participantId')
  updateParticipant(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateParticipantDto,
  ) {
    return this.roomsService.updateParticipant(id, participantId, userId, dto);
  }

  @Post(':id/start')
  start(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.roomsService.start(id, userId);
  }

  @Post(':id/end')
  end(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.roomsService.end(id, userId, RoomStatus.ENDED);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.roomsService.end(id, userId, RoomStatus.CANCELLED);
  }

  @Post(':id/leave')
  leave(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.roomsService.leave(id, userId);
  }

  @Post(':id/media-token')
  @ApiOperation({ summary: 'Émettre un jeton LiveKit temporaire, limité à une salle' })
  getMediaToken(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.roomsService.getMediaToken(id, userId);
  }

  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.roomsService.getMessages(
      id,
      userId,
      pagination.page ?? 1,
      pagination.limit ?? 50,
    );
  }

  @Post(':id/messages')
  createMessage(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRoomMessageDto,
  ) {
    return this.roomsService.createMessage(id, userId, dto.message);
  }

  @Patch(':id/notes')
  updateNotes(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateRoomNotesDto,
  ) {
    return this.roomsService.updateNotes(id, userId, dto.notes);
  }
}
