import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Login ──────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const { identifier, password } = dto;

    // Find user by email or DNI
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier.toLowerCase() }, { dni: identifier }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  // ─── Register ────────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const { dni, email, phone, firstName, lastName, password, birthDate } = dto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { dni }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      if (existingUser.dni === dni) {
        throw new ConflictException('El DNI ya está registrado');
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        dni,
        email: email.toLowerCase(),
        phone,
        firstName,
        lastName,
        passwordHash,
        birthDate: birthDate || null,
        role: 'USER',
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────
  async logout(userId: string, refreshToken: string) {
    // Remove the specific refresh token
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId },
    });

    for (const storedToken of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, storedToken.tokenHash);
      if (isMatch) {
        await this.prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
        break;
      }
    }

    return { message: 'Sesión cerrada exitosamente' };
  }

  // ─── Refresh Tokens ──────────────────────────────────────────────────────────
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });

    let validTokenRecord = null;
    for (const storedToken of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, storedToken.tokenHash);
      if (isMatch) {
        validTokenRecord = storedToken;
        break;
      }
    }

    if (!validTokenRecord) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    // Delete the old refresh token (rotation)
    await this.prisma.refreshToken.delete({
      where: { id: validTokenRecord.id },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  // ─── Forgot Password ─────────────────────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const { identifier } = dto;

    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier.toLowerCase() }, { dni: identifier }] },
    });

    // Always return success to prevent user enumeration
    if (!user) return { message: 'Si el usuario existe, recibirá el código por correo.' };

    // Invalidar códigos anteriores
    await this.prisma.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await this.prisma.passwordReset.create({
      data: { userId: user.id, code, expiresAt },
    });

    await this.emailService.sendPasswordReset(user.email, user.firstName, code);

    return { message: 'Se envió el código de verificación a tu correo.' };
  }

  // ─── Reset Password ───────────────────────────────────────────────────────────
  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });
    if (!user) throw new BadRequestException('Usuario no encontrado');

    const reset = await this.prisma.passwordReset.findFirst({
      where: { userId: user.id, code, used: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!reset) throw new BadRequestException('Código inválido');
    if (reset.expiresAt < new Date()) throw new BadRequestException('El código ha expirado');
    if (newPassword.length < 6) throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await Promise.all([
      this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      this.prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } }),
    ]);

    return { message: 'Contraseña restablecida exitosamente' };
  }

  // ─── Get Me ──────────────────────────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        dni: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        role: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES') || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES') || '7d';

    // Parse expiry
    const expiresAt = new Date();
    const days = parseInt(expiresIn.replace('d', ''));
    expiresAt.setDate(expiresAt.getDate() + (isNaN(days) ? 7 : days));

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    // Clean up expired tokens for this user
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        expiresAt: { lt: new Date() },
      },
    });
  }
}
