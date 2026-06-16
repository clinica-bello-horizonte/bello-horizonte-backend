import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BirthDateChangeRequestDto } from './dto/birthdate-change-request.dto';

// Campos públicos del usuario (sin passwordHash) que se devuelven al cliente.
const USER_SELECT = {
  id: true,
  dni: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  birthDate: true,
  birthDateLocked: true,
  role: true,
  photoUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async saveFcmToken(userId: string, token: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // La fecha de nacimiento solo puede establecerse/cambiarse UNA vez desde el
    // perfil (anti-fraude). Si ya se usó esa edición, requiere verificación de
    // la clínica (endpoint requestBirthDateChange).
    const wantsBirthChange =
      dto.birthDate !== undefined && dto.birthDate !== user.birthDate;
    if (wantsBirthChange && user.birthDateLocked) {
      throw new ForbiddenException(
        'La fecha de nacimiento ya fue establecida. Para cambiarla debes solicitar verificación a la clínica.',
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.phone && { phone: dto.phone }),
        // Al cambiarla, se consume la única edición libre (queda bloqueada).
        ...(wantsBirthChange && {
          birthDate: dto.birthDate,
          birthDateLocked: true,
        }),
      },
      select: USER_SELECT,
    });

    return updatedUser;
  }

  /**
   * Solicita verificación a la clínica para cambiar una fecha de nacimiento ya
   * bloqueada. No modifica el dato: envía un correo a la clínica para que su
   * personal valide la identidad y lo actualice manualmente.
   */
  async requestBirthDateChange(userId: string, dto: BirthDateChangeRequestDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    await this.email.sendBirthDateChangeRequest({
      firstName: user.firstName,
      lastName: user.lastName,
      dni: user.dni,
      email: user.email,
      phone: user.phone,
      currentBirthDate: user.birthDate,
      requestedBirthDate: dto.requestedBirthDate,
      reason: dto.reason,
    });

    return {
      success: true,
      message:
        'Tu solicitud fue enviada a la clínica. Te contactarán para verificar tu identidad.',
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('La contraseña actual es incorrecta');

    if (newPassword.length < 6) throw new BadRequestException('La nueva contraseña debe tener al menos 6 caracteres');

    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return { success: true };
  }
}
