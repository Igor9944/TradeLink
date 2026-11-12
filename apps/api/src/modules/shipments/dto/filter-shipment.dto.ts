import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ShipmentStatus } from './update-shipment-status.dto';

export class FilterShipmentDto {
  @ApiProperty({ required: false, description: 'ID de la commande' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ required: false, description: 'ID du transporteur' })
  @IsOptional()
  @IsString()
  transporterId?: string;

  @ApiProperty({ required: false, enum: ShipmentStatus })
  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @ApiProperty({ required: false, description: 'Numéro d\'expédition' })
  @IsOptional()
  @IsString()
  shipmentNumber?: string;
}
