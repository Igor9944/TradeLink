import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketCategory {
  TECHNICAL = 'TECHNICAL',
  BILLING = 'BILLING',
  LOGISTICS = 'LOGISTICS',
  ACCOUNT = 'ACCOUNT',
  OTHER = 'OTHER',
}

export class CreateTicketDto {
  @ApiProperty({ description: 'Sujet du ticket' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'Message initial', required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ enum: TicketPriority, default: 'MEDIUM' })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiProperty({ enum: TicketCategory, required: false })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiProperty({ description: 'Type de contexte (Order, Product, etc.)', required: false })
  @IsOptional()
  @IsString()
  contextType?: string;

  @ApiProperty({ description: 'ID du contexte', required: false })
  @IsOptional()
  @IsString()
  contextId?: string;
}
