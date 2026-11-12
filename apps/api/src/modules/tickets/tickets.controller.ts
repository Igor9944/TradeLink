import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { FilterTicketDto } from './dto/filter-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AddTicketMessageDto } from './dto/add-ticket-message.dto';

@ApiTags('Tickets')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau ticket de support' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les tickets avec filtres' })
  findAll(
    @Query() filters: FilterTicketDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.ticketsService.findAll(filters, userId, userRole);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des tickets' })
  getStats(@CurrentUser('id') userId: string, @CurrentUser('role') userRole: string) {
    const statsUserId = ['CLIENT', 'SUPPLIER', 'TRANSPORTER'].includes(userRole) ? userId : undefined;
    return this.ticketsService.getStats(statsUserId);
  }

  @Get(':ticketNumber')
  @ApiOperation({ summary: 'Récupérer un ticket avec tous ses messages' })
  findOne(
    @Param('ticketNumber') ticketNumber: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.ticketsService.findOne(ticketNumber, userId, userRole);
  }

  @Post(':ticketNumber/messages')
  @ApiOperation({ summary: 'Ajouter un message à un ticket' })
  addMessage(
    @Param('ticketNumber') ticketNumber: string,
    @Body() dto: AddTicketMessageDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.ticketsService.addMessage(ticketNumber, dto, userId, userRole);
  }

  @Patch(':ticketNumber/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'un ticket (SUPPORT/ADMIN seulement)' })
  updateStatus(
    @Param('ticketNumber') ticketNumber: string,
    @Body() dto: UpdateTicketStatusDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.ticketsService.updateStatus(ticketNumber, dto, userId, userRole);
  }

  @Patch(':ticketNumber/assign/:assigneeId')
  @ApiOperation({ summary: 'Assigner un ticket à un agent (SUPPORT/ADMIN seulement)' })
  assignTicket(
    @Param('ticketNumber') ticketNumber: string,
    @Param('assigneeId') assigneeId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.ticketsService.assignTicket(ticketNumber, assigneeId, userId, userRole);
  }
}
