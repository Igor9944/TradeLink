import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, Min } from 'class-validator';

export class UpdateProductStockDto {
  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiProperty({ enum: ['add', 'subtract', 'set'] })
  @IsIn(['add', 'subtract', 'set'])
  operation: 'add' | 'subtract' | 'set';
}