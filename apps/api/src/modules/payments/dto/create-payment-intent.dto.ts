import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty()
  @IsString()
  invoiceId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.5) // Minimum Stripe : 0.50 (50 centimes)
  amount: number;

  @ApiProperty({ default: 'TND' })
  @IsString()
  currency: string;
}
