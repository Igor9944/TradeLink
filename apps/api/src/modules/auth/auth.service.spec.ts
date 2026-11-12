import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditAction, Role, UserStatus } from '@prisma/client';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { PrismaService } from '../../prisma/prisma.service';
import { BrevoService } from '../emails/brevo.service';
import { SmsService } from '../sms/sms.service';
import { AuthService } from './auth.service';

jest.mock('@otplib/totp', () => ({
  TOTP: class {
    verify = jest.fn();
    generateSecret = jest.fn();
    toURI = jest.fn();
  },
}));
jest.mock('@otplib/plugin-crypto-node', () => ({ NodeCryptoPlugin: class {} }));
jest.mock('@otplib/plugin-base32-scure', () => ({ ScureBase32Plugin: class {} }));

describe('AuthService MFA', () => {
  const createHarness = (userOverrides: Record<string, unknown> = {}) => {
    const user = {
      id: 'user-1',
      email: 'user@example.test',
      phone: null,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: '',
      mfaEnabled: true,
      mfaSecret: 'encrypted-secret',
      recoveryCodes: null as string | null,
      ...userOverrides,
    };
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(user),
        findUniqueOrThrow: jest.fn().mockResolvedValue(user),
        update: jest.fn().mockResolvedValue(user),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      userSession: {
        create: jest.fn().mockResolvedValue({ id: 'session-1' }),
        update: jest.fn().mockResolvedValue({ id: 'session-1' }),
      },
      $transaction: jest.fn((callback) =>
        callback({ user: { updateMany: prisma.user.updateMany } }),
      ),
    };
    const jwt = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verifyAsync: jest.fn().mockResolvedValue({
        sub: user.id,
        purpose: 'mfa_challenge',
      }),
    };
    const crypto = {
      encrypt: jest.fn().mockResolvedValue('encrypted-secret'),
      decrypt: jest.fn().mockResolvedValue('base32-secret'),
    };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      {
        get: jest.fn((key: string) =>
          key === 'JWT_REFRESH_SECRET' ? 'refresh-secret' : '7d',
        ),
      } as unknown as ConfigService,
      {} as BrevoService,
      {} as SmsService,
      crypto as unknown as CryptoUtil,
      audit as unknown as AuditService,
    );

    return { service, prisma, jwt, crypto, audit, user };
  };

  it('returns a signed MFA challenge only after a valid password', async () => {
    const passwordHash = await bcrypt.hash('ValidPassword123!', 4);
    const { service, jwt, prisma } = createHarness({ passwordHash });

    const response = await service.login({
      email: 'user@example.test',
      password: 'ValidPassword123!',
    });

    expect(response).toEqual({ requiresMfa: true, challengeToken: 'signed-token' });
    expect(jwt.sign).toHaveBeenCalledWith(
      { sub: 'user-1', purpose: 'mfa_challenge' },
      { expiresIn: '5m' },
    );
    expect(prisma.userSession.create).not.toHaveBeenCalled();
  });

  it('stores hashed recovery codes and returns the raw values once', async () => {
    const { service, prisma } = createHarness({ mfaEnabled: false });
    Object.defineProperty(service, 'totp', {
      value: { verify: jest.fn().mockResolvedValue({ valid: true }) },
    });

    const result = await service.enableMfa('user-1', { code: '123456' });
    const storedCodes = prisma.user.update.mock.calls[0][0].data.recoveryCodes.split(',');

    expect(result.recoveryCodes).toHaveLength(10);
    expect(result.recoveryCodes.every((code) => code.length === 32)).toBe(true);
    expect(storedCodes).toHaveLength(10);
    expect(storedCodes.every((code) => /^sha256:[a-f0-9]{64}$/.test(code))).toBe(true);
    expect(storedCodes).not.toEqual(result.recoveryCodes);
  });

  it('consumes recovery codes once with an atomic compare-and-set', async () => {
    const recoveryCode = 'A1'.repeat(16);
    const storedHash = `sha256:${createHash('sha256').update(recoveryCode).digest('hex')}`;
    const { service, prisma, audit } = createHarness({ recoveryCodes: storedHash });
    prisma.user.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    const response = await service.verifyRecoveryCode('challenge-token', recoveryCode);

    expect(response.access_token).toBe('signed-token');
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
        mfaEnabled: true,
        status: { notIn: [UserStatus.BANNED, UserStatus.SUSPENDED] },
        recoveryCodes: storedHash,
      },
      data: { recoveryCodes: null },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.MFA_RECOVERY_USED }),
    );
    await expect(
      service.verifyRecoveryCode('challenge-token', recoveryCode),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects expired MFA challenges before loading the account', async () => {
    const { service, jwt, prisma } = createHarness();
    const expired = new Error('expired');
    expired.name = 'TokenExpiredError';
    jwt.verifyAsync.mockRejectedValue(expired);

    await expect(
      service.verifyRecoveryCode('expired-challenge', 'A1'.repeat(16)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('does not complete MFA for suspended accounts', async () => {
    const { service } = createHarness({ status: UserStatus.SUSPENDED });
    Object.defineProperty(service, 'totp', {
      value: { verify: jest.fn() },
    });

    await expect(
      service.verifyMfa('challenge-token', { challengeToken: 'challenge-token', code: '123456' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
