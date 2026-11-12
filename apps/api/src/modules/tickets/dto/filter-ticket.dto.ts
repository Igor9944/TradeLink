import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from './update-ticket-status.dto';
import { TicketPriority, TicketCategory } from './create-ticket.dto';

export class FilterTicketDto {
  @ApiProperty({ required: false, enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiProperty({ required: false, enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiProperty({ required: false, enum: TicketCategory })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiProperty({ required: false, description: 'ID de l\'assigné' })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiProperty({ required: false, description: 'ID du créateur' })
  @IsOptional()
  @IsString()
  createdById?: string;
}
