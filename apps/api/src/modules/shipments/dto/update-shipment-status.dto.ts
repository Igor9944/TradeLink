import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ShipmentStatus {
  ASSIGNED = 'ASSIGNED',
  PICKUP = 'PICKUP',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED',
}

export class UpdateShipmentStatusDto {
  @ApiProperty({ enum: ShipmentStatus, description: 'Nouveau statut de la livraison' })
  @IsEnum(ShipmentStatus)
  status: ShipmentStatus;

  @ApiProperty({ description: 'Localisation actuelle', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Notes/commentaires', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
