import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddTicketMessageDto {
  @ApiProperty({ description: 'Contenu du message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Réponse suggérée par l\'IA', default: false })
  @IsOptional()
  @IsBoolean()
  isAiSuggestion?: boolean;

  @ApiProperty({ description: 'URL d\'une pièce jointe', required: false })
  @IsOptional()
  @IsUrl()
  attachmentUrl?: string;
}
