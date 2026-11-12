import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, IsArray, ValidateNested, Min, Max, IsObject, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { Lang } from '@prisma/client';

class MultilingualStringDto {
  @ApiProperty()
  @IsString()
  fr: string;

  @ApiProperty()
  @IsString()
  en: string;

  @ApiProperty()
  @IsString()
  ar: string;
}

class ProductImageDto {
  @ApiProperty()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  altText?: { fr?: string; en?: string; ar?: string };

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  position?: number;
}

class ProductTranslationDto {
  @ApiProperty({ enum: Lang })
  @IsEnum(Lang)
  lang: Lang;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specs?: string;
}

class ProductVariantDto {
  @ApiProperty()
  @IsObject()
  name: { fr: string; en: string; ar: string };

  @ApiProperty()
  @IsString()
  sku: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceHT?: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  stockQuantity: number;
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  sku: string;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => MultilingualStringDto)
  name: { fr: string; en: string; ar: string };

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  priceHT: number;

  @ApiPropertyOptional({ default: 0.19 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockAlertLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ type: [ProductImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @ApiPropertyOptional({ type: [ProductTranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductTranslationDto)
  translations?: ProductTranslationDto[];

  @ApiPropertyOptional({ type: [ProductVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}
