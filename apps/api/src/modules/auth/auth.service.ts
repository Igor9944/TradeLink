import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import {
  EnableMfaDto,
  DisableMfaDto,
  MfaSetupResponseDto,
  VerifyMfaLoginDto,
} from './dto/mfa.dto';
import { Prisma, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { JwtPayload, JwtRefreshPayload } from '../../common/types/jwt-payload.type';
import { BrevoService } from '../emails/brevo.service';
import { SmsService } from '../sms/sms.service';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';
import { TOTP } from '@otplib/totp';
import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly totp = new TOTP({
    crypto: new NodeCryptoPlugin(),
    base32: new ScureBase32Plugin(),
  });

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private brevoService: BrevoService,
    private smsService: SmsService,
    private cryptoUtil: CryptoUtil,
    private auditService: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Un email ou un numéro de téléphone est requis');
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          dto.email ? { email: dto.email } : undefined,
          dto.phone ? { phone: dto.phone } : undefined,
        ].filter(Boolean),
      },
    });
    if (existing) throw new ConflictException('Email ou téléphone déjà utilisé');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const role = dto.role ?? Role.CLIENT;
    const kycDeadline = new Date();
    kycDeadline.setDate(kycDeadline.getDate() + (this.config.get<number>('KYC_DEADLINE_DAYS') || 7));

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role,
        preferredLang: dto.preferredLang ?? 'FR',
        displayName: dto.displayName ? { fr: dto.displayName } : null,
        kycDeadline: ([Role.CLIENT, Role.SUPPLIER, Role.TRANSPORTER] as Role[]).includes(role)
          ? kycDeadline
          : null,
        kyc: { create: {} },
      },
    });

    try {
      await this.sendOtp(user.id, 'REGISTER', dto.email ? 'EMAIL' : 'SMS');
    } catch (error) {
      await this.prisma.user.delete({ where: { id: user.id } });
      throw error;
    }
    this.logger.log(`New user registered: ${user.id} (${user.role})`);
    return { message: 'Inscription réussie. Vérifiez votre code OTP.', userId: user.id };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    await this.prisma.$transaction((tx) =>
      this.verifyAndConsumeOtp(tx, dto.userId, dto.code, 'REGISTER'),
    );

    return { message: 'OTP vérifié avec succès' };
  }

  async login(dto: LoginDto, ipAddress?: string, deviceInfo?: string) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone is required');
    }
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          dto.email ? { email: dto.email } : undefined,
          dto.phone ? { phone: dto.phone } : undefined,
        ].filter(Boolean),
      },
    });

    const dummyHash = '$2b$12$dummyhashdummyhashdummyhashdummy';
    const hashToCompare = user?.passwordHash ?? dummyHash;
    const isPasswordValid = await bcrypt.compare(dto.password, hashToCompare);

    if (!user || !user.passwordHash || !isPasswordValid) {
      await this.auditService.log({
        action: AuditAction.LOGIN_FAILED,
        targetType: 'User',
        targetId: user?.id,
        metadata: { email: dto.email, phone: dto.phone },
        ipAddress,
        userAgent: deviceInfo,
      });
      throw new UnauthorizedException('Identifiants incorrects');
    }
    if (user.status === UserStatus.BANNED) throw new ForbiddenException('Compte banni');
    if (user.status === UserStatus.SUSPENDED) throw new ForbiddenException('Compte suspendu — KYC non validé');

    if (user.mfaEnabled) {
      return {
        requiresMfa: true,
        challengeToken: this.jwtService.sign(
          { sub: user.id, purpose: 'mfa_challenge' },
          { expiresIn: '5m' },
        ),
      };
    }

    const tokens = await this.generateTokens(user.id, user.email ?? '', user.role, ipAddress, deviceInfo);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    await this.auditService.log({
      action: AuditAction.LOGIN,
      actorId: user.id,
      targetType: 'User',
      targetId: user.id,
      ipAddress,
      userAgent: deviceInfo,
    });

    this.logger.log(`User logged in: ${user.id}`);
    return {
      ...tokens,
      user: {
        id: user.id,
        role: user.role,
        status: user.status,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        preferredLang: user.preferredLang,
        createdAt: user.createdAt,
      },
    };
  }

  async refreshToken(userId: string, sessionId: string, refreshToken: string) {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.userSession.findFirst({
        where: { id: sessionId, userId, isRevoked: false, expiresAt: { gt: new Date() } },
        include: { user: true },
      });
      if (!session) throw new UnauthorizedException('Session invalide ou expirée');

      if (!(await bcrypt.compare(refreshToken, session.refreshToken))) {
        throw new UnauthorizedException('Token de rafraîchissement invalide');
      }

      const payload: JwtPayload = {
        sub: userId,
        email: session.user.email ?? '',
        role: session.user.role,
        sessionId,
      };
      const accessToken = this.jwtService.sign(payload);
      const nextRefreshToken = this.jwtService.sign(
        { sub: userId, sessionId } satisfies JwtRefreshPayload,
        {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
        },
      );
      if (
        session.user.status === UserStatus.BANNED ||
        session.user.status === UserStatus.SUSPENDED
      ) {
        throw new ForbiddenException('Ce compte ne peut pas renouveler sa session');
      }

      const updated = await tx.userSession.update({
        where: { id: sessionId },
        data: {
          refreshToken: await bcrypt.hash(nextRefreshToken, 8),
          lastUsedAt: new Date(),
        },
      });
      if (!updated) throw new UnauthorizedException('Session invalide ou expirée');

      return { access_token: accessToken, refresh_token: nextRefreshToken, session_id: sessionId };
    }, { timeout: 5000 });
  }

  async logout(sessionId: string) {
    const session = await this.prisma.userSession.findUnique({ where: { id: sessionId } });

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        isRevoked: true,
        refreshToken: await bcrypt.hash(randomBytes(32).toString('hex'), 8),
      },
    });

    if (session?.userId) {
      await this.auditService.log({
        action: AuditAction.LOGOUT,
        actorId: session.userId,
        targetType: 'UserSession',
        targetId: sessionId,
      });
    }

    return { message: 'Déconnexion réussie' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'Si cet email existe, un code a été envoyé.' };
    await this.sendOtp(user.id, 'RESET_PASSWORD', 'EMAIL');
    return { message: 'Si cet email existe, un code a été envoyé.' };
  }

  async requestAdminPasswordReset(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new BadRequestException('Utilisateur introuvable');
    if (!user.email) throw new BadRequestException('Cet utilisateur ne possède pas d’adresse email vérifiée');
    await this.sendOtp(user.id, 'RESET_PASSWORD', 'EMAIL');
    await this.auditService.log({
      action: AuditAction.UPDATE,
      actorId: adminId,
      targetType: 'User',
      targetId: userId,
      metadata: { action: 'ADMIN_REQUESTED_PASSWORD_RESET' },
    });
    return { message: 'Un code de réinitialisation a été envoyé à l’adresse de l’utilisateur.' };
  }

  async resetPassword(dto: { email: string; code: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new BadRequestException('Code OTP invalide ou expiré');
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.$transaction(async (tx) => {
      await this.verifyAndConsumeOtp(tx, user.id, dto.code, 'RESET_PASSWORD');
      await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
      await tx.userSession.updateMany({
        where: { userId: user.id, isRevoked: false },
        data: { isRevoked: true },
      });
    });
    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: Role,
    ipAddress?: string,
    deviceInfo?: string,
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await this.prisma.userSession.create({
      data: {
        userId,
        refreshToken: await bcrypt.hash(userId + Date.now(), 8),
        deviceInfo,
        ipAddress,
        expiresAt,
      },
    });

    const payload: JwtPayload = { sub: userId, email, role, sessionId: session.id };
    const refreshPayload: JwtRefreshPayload = { sub: userId, sessionId: session.id };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { refreshToken: await bcrypt.hash(refreshToken, 8) },
    });

    return { access_token: accessToken, refresh_token: refreshToken, session_id: session.id };
  }

  async sendOtp(
    userId: string,
    purpose: 'REGISTER' | 'RESET_PASSWORD',
    channel: 'EMAIL' | 'SMS',
  ) {
    const code = String(randomInt(100000, 999999));
    const expiresInMinutes = this.config.get<number>('OTP_EXPIRES_IN_MINUTES') || 10;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
    const hashedCode = await bcrypt.hash(code, 8);

    const otpRecord = await this.prisma.otpCode.create({
      data: { userId, code: hashedCode, purpose, channel, expiresAt },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, phone: true, preferredLang: true },
    });
    const language = user.preferredLang === 'EN' ? 'en' : user.preferredLang === 'AR' ? 'ar' : 'fr';

    try {
      if (channel === 'EMAIL' && user.email) {
        await this.brevoService.sendOtpEmail(user.email, code, language, expiresInMinutes);
      } else if (channel === 'SMS' && user.phone) {
        await this.smsService.sendOTP(user.phone, code, language, expiresInMinutes);
      } else {
        throw new BadRequestException(`No ${channel.toLowerCase()} address is configured for this user`);
      }
    } catch (error) {
      await this.prisma.otpCode.delete({ where: { id: otpRecord.id } });
      throw error;
    }

    return { message: 'OTP envoyé' };
  }

  private async verifyAndConsumeOtp(
    tx: Prisma.TransactionClient,
    userId: string,
    code: string,
    purpose: 'REGISTER' | 'RESET_PASSWORD',
  ) {
    const otpRecord = await tx.otpCode.findFirst({
      where: {
        userId,
        purpose,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) throw new BadRequestException('Code OTP invalide ou expiré');
    if (!(await bcrypt.compare(code, otpRecord.code))) {
      throw new BadRequestException('Code OTP incorrect');
    }

    const consumed = await tx.otpCode.updateMany({
      where: { id: otpRecord.id, isUsed: false, expiresAt: { gt: new Date() } },
      data: { isUsed: true },
    });
    if (consumed.count !== 1) {
      throw new BadRequestException('Code OTP invalide ou expiré');
    }
  }

  async setupMfa(userId: string): Promise<MfaSetupResponseDto> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA déjà activé');
    }

    const secret = this.totp.generateSecret();
    const otpAuthUrl = this.totp.toURI({
      label: user.email ?? user.phone ?? user.id,
      issuer: 'TradeLink',
      secret,
    });

    const encryptedSecret = await this.cryptoUtil.encrypt(secret);
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: encryptedSecret },
    });

    return { secret, otpAuthUrl };
  }

  async enableMfa(userId: string, dto: EnableMfaDto): Promise<{ message: string; recoveryCodes: string[] }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA déjà activé');
    }
    if (!user.mfaSecret) {
      throw new BadRequestException('Configuration MFA non initialisée');
    }

    const secret = await this.cryptoUtil.decrypt(user.mfaSecret);
    const result = await this.totp.verify(dto.code, { secret });

    if (!result.valid) {
      throw new UnauthorizedException('Code TOTP invalide');
    }

    const recoveryCodes = Array.from({ length: 10 }, () =>
      randomBytes(16).toString('hex').toUpperCase(),
    );
    const hashedRecoveryCodes = recoveryCodes.map((code) => this.hashRecoveryCode(code));

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        recoveryCodes: hashedRecoveryCodes.join(','),
      },
    });

    await this.auditService.log({
      action: AuditAction.MFA_ENABLED,
      actorId: userId,
      targetType: 'User',
      targetId: userId,
    });

    this.logger.log(`MFA enabled for user: ${userId}`);
    return { message: 'MFA activé avec succès', recoveryCodes };
  }

  async verifyMfa(
    challengeToken: string,
    dto: VerifyMfaLoginDto,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<{ access_token: string; refresh_token: string; session_id: string }> {
    const userId = await this.getMfaChallengeUserId(challengeToken);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (user.status === UserStatus.BANNED || user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Ce compte ne peut pas accéder à la plateforme');
    }
    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA non activé');
    }
    if (!user.mfaSecret) {
      throw new BadRequestException('Secret MFA manquant');
    }

    const secret = await this.cryptoUtil.decrypt(user.mfaSecret);
    const result = await this.totp.verify(dto.code, { secret });

    if (!result.valid) {
      throw new UnauthorizedException('Code TOTP invalide');
    }

    await this.auditService.log({
      action: AuditAction.MFA_VERIFIED,
      actorId: userId,
      targetType: 'User',
      targetId: userId,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.auditService.log({
      action: AuditAction.LOGIN,
      actorId: user.id,
      targetType: 'User',
      targetId: user.id,
      ipAddress,
      userAgent: deviceInfo,
    });

    return this.generateTokens(user.id, user.email ?? '', user.role, ipAddress, deviceInfo);
  }

  async disableMfa(userId: string, dto: DisableMfaDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA non activé');
    }
    if (!user.mfaSecret) {
      throw new BadRequestException('Secret MFA manquant');
    }

    const secret = await this.cryptoUtil.decrypt(user.mfaSecret);
    const result = await this.totp.verify(dto.code, { secret });

    if (!result.valid) {
      throw new UnauthorizedException('Code TOTP invalide');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        recoveryCodes: null,
      },
    });

    await this.auditService.log({
      action: AuditAction.MFA_DISABLED,
      actorId: userId,
      targetType: 'User',
      targetId: userId,
    });

    this.logger.log(`MFA disabled for user: ${userId}`);
    return { message: 'MFA désactivé avec succès' };
  }

  async verifyRecoveryCode(
    challengeToken: string,
    code: string,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<{ access_token: string; refresh_token: string; session_id: string }> {
    const userId = await this.getMfaChallengeUserId(challengeToken);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (user.status === UserStatus.BANNED || user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Ce compte ne peut pas accéder à la plateforme');
    }
    if (!user.mfaEnabled || !user.recoveryCodes) {
      throw new BadRequestException('Aucun code de récupération disponible');
    }

    const codes = user.recoveryCodes.split(',').map((storedCode) => storedCode.trim());
    let codeIndex = -1;
    for (let index = 0; index < codes.length; index += 1) {
      if (this.recoveryCodeMatches(code, codes[index])) {
        codeIndex = index;
        break;
      }
    }

    if (codeIndex === -1) {
      throw new UnauthorizedException('Code de récupération invalide');
    }

    const remainingCodes = await Promise.all(
      codes
        .filter((_, index) => index !== codeIndex)
        .map((storedCode) =>
          storedCode.startsWith('sha256:')
            ? storedCode
            : this.hashRecoveryCode(storedCode),
        ),
    );
    const consumed = await this.prisma.$transaction((tx) =>
      tx.user.updateMany({
        where: {
          id: userId,
          mfaEnabled: true,
          status: { notIn: [UserStatus.BANNED, UserStatus.SUSPENDED] },
          recoveryCodes: user.recoveryCodes,
        },
        data: { recoveryCodes: remainingCodes.length ? remainingCodes.join(',') : null },
      }),
    );
    if (consumed.count !== 1) {
      throw new UnauthorizedException('Code de récupération déjà utilisé ou invalide');
    }

    await this.auditService.log({
      action: AuditAction.MFA_RECOVERY_USED,
      actorId: userId,
      targetType: 'User',
      targetId: userId,
      metadata: { remainingCodes: codes.length },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.auditService.log({
      action: AuditAction.LOGIN,
      actorId: user.id,
      targetType: 'User',
      targetId: user.id,
      ipAddress,
      userAgent: deviceInfo,
    });

    return this.generateTokens(user.id, user.email ?? '', user.role, ipAddress, deviceInfo);
  }

  private async getMfaChallengeUserId(challengeToken: string): Promise<string> {
    let payload: { sub?: string; purpose?: string };
    try {
      payload = await this.jwtService.verifyAsync(challengeToken);
    } catch (error) {
      if (
        error instanceof Error &&
        ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)
      ) {
        throw new UnauthorizedException('Challenge MFA invalide ou expiré');
      }
      throw error;
    }

    if (payload.purpose !== 'mfa_challenge' || typeof payload.sub !== 'string') {
      throw new UnauthorizedException('Challenge MFA invalide ou expiré');
    }
    return payload.sub;
  }

  private hashRecoveryCode(code: string): string {
    const hash = createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
    return `sha256:${hash}`;
  }

  private recoveryCodeMatches(code: string, storedCode: string): boolean {
    const normalizedCode = code.trim().toUpperCase();
    if (!storedCode.startsWith('sha256:')) {
      return storedCode.toUpperCase() === normalizedCode;
    }

    const storedHash = storedCode.slice('sha256:'.length);
    if (!/^[a-f0-9]{64}$/i.test(storedHash)) return false;

    const candidateHash = createHash('sha256').update(normalizedCode).digest();
    return timingSafeEqual(candidateHash, Buffer.from(storedHash, 'hex'));
  }
}
