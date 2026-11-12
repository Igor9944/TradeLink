import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddProofOfDeliveryDto {
  @ApiProperty({ 
    description: 'URLs des photos de livraison',
    type: [String],
    example: ['https://storage.tradelink.com/proofs/photo1.jpg']
  })
  @IsArray()
  @IsUrl({}, { each: true })
  photoUrls: string[];

  @ApiProperty({ description: 'URL de la signature', required: false })
  @IsOptional()
  @IsUrl()
  signatureUrl?: string;

  @ApiProperty({ description: 'Nom du réceptionnaire', required: false })
  @IsOptional()
  @IsString()
  receiverName?: string;

  @ApiProperty({ description: 'Notes/commentaires', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
