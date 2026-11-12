import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsIn, IsEnum } from 'class-validator';
import { Role, Lang } from '@prisma/client';

export class RegisterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsIn([Role.CLIENT, Role.SUPPLIER, Role.TRANSPORTER])
  role?: Role;

  @ApiPropertyOptional({ enum: Lang })
  @IsOptional()
  @IsEnum(Lang)
  preferredLang?: Lang;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;
}
