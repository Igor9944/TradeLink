import { IsString, IsNotEmpty, IsOptional, IsDateString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShipmentDto {
  @ApiProperty({ description: 'ID de la commande' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'ID du transporteur (User avec role TRANSPORTER)' })
  @IsString()
  @IsNotEmpty()
  transporterId: string;

  @ApiProperty({ description: 'Date estimée de livraison', required: false })
  @IsOptional()
  @IsDateString()
  estimatedDelivery?: string;

  @ApiProperty({ 
    description: 'Adresse de récupération (JSON)', 
    example: { street: '123 Rue des Entreprises', city: 'Tunis', zipCode: '1000', country: 'TN' }
  })
  @IsObject()
  @IsNotEmpty()
  pickupAddress: Record<string, any>;

  @ApiProperty({ 
    description: 'Adresse de livraison (JSON)', 
    example: { street: '456 Avenue du Client', city: 'Sousse', zipCode: '4000', country: 'TN' }
  })
  @IsObject()
  @IsNotEmpty()
  deliveryAddress: Record<string, any>;

  @ApiProperty({ description: 'Plaque d\'immatriculation du véhicule', required: false })
  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @ApiProperty({ description: 'Type de véhicule', required: false })
  @IsOptional()
  @IsString()
  vehicleType?: string;
}
