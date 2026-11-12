import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class JoinRoomDto {
  @ApiPropertyOptional({ description: 'Short room code shared by the host' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  roomCode?: string;

  @ApiPropertyOptional({ description: 'High-entropy token from the private invitation link' })
  @IsOptional()
  @IsString()
  @MinLength(32)
  @MaxLength(128)
  inviteToken?: string;
}
