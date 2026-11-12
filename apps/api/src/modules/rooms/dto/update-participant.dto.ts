import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParticipantRole } from '@prisma/client';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateParticipantDto {
  @ApiProperty({ enum: ['ADMIT', 'REJECT', 'REMOVE', 'CHANGE_ROLE'] })
  @IsIn(['ADMIT', 'REJECT', 'REMOVE', 'CHANGE_ROLE'])
  action: 'ADMIT' | 'REJECT' | 'REMOVE' | 'CHANGE_ROLE';

  @ApiPropertyOptional({ enum: [ParticipantRole.MODERATOR, ParticipantRole.PARTICIPANT] })
  @IsOptional()
  @IsString()
  @IsIn([ParticipantRole.MODERATOR, ParticipantRole.PARTICIPANT])
  participantRole?: 'MODERATOR' | 'PARTICIPANT';
}
