import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsIn, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsString()
  @Matches(/^\d{6}$/)
  code: string;

  @ApiPropertyOptional({ enum: ['REGISTER'] })
  @IsOptional()
  @IsIn(['REGISTER'])
  purpose?: 'REGISTER';
}
