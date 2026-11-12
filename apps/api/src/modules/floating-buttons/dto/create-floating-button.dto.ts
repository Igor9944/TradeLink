import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FloatingButtonTarget } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateFloatingButtonDto {
  @ApiProperty({ example: { fr: 'Calculatrice', en: 'Calculator', ar: 'آلة حاسبة' } })
  @IsObject()
  title: Record<string, string>;

  @ApiProperty()
  @IsString()
  icon: string;

  @ApiProperty({ example: '#1D4ED8' })
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color: string;

  @ApiProperty({ example: '/dashboard/accounting' })
  @IsString()
  targetUrl: string;

  @ApiPropertyOptional({ enum: FloatingButtonTarget, default: FloatingButtonTarget.ALL })
  @IsOptional()
  @IsEnum(FloatingButtonTarget)
  targetRole?: FloatingButtonTarget;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  positionOrder?: number;
}
