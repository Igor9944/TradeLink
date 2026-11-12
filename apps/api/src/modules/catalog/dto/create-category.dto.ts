import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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

export class CreateCategoryDto {
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
  parentId?: string;
}
