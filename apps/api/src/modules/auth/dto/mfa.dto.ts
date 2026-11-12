import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsString, Length, Matches } from 'class-validator';

export class EnableMfaDto {
  @ApiProperty({ description: 'Code TOTP from authenticator app' })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class VerifyMfaDto {
  @ApiProperty({ description: 'Code TOTP from authenticator app' })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class VerifyMfaLoginDto {
  @ApiProperty({ description: 'Short-lived challenge returned after password verification' })
  @IsJWT()
  challengeToken: string;

  @ApiProperty({ description: 'Code TOTP from authenticator app' })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class VerifyMfaRecoveryDto {
  @ApiProperty({ description: 'Short-lived challenge returned after password verification' })
  @IsJWT()
  challengeToken: string;

  @ApiProperty({ description: 'One-time recovery code' })
  @IsString()
  @Matches(/^[0-9a-f]{8,32}$/i)
  code: string;
}

export class DisableMfaDto {
  @ApiProperty({ description: 'Code TOTP from authenticator app' })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class MfaSetupResponseDto {
  @ApiProperty({ description: 'TOTP secret (base32 encoded)' })
  secret: string;

  @ApiProperty({ description: 'OTP Auth URI for QR code' })
  otpAuthUrl: string;
}