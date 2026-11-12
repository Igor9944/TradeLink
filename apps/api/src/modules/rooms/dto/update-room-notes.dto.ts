import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateRoomNotesDto {
  @ApiProperty({ maxLength: 20000 })
  @IsString()
  @MaxLength(20000)
  notes: string;
}
