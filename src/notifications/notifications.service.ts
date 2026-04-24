import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private app: admin.app.App | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT not set — push notifications disabled');
      return;
    }
    try {
      const serviceAccount = JSON.parse(raw);
      if (!admin.apps.length) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        this.app = admin.apps[0]!;
      }
      this.logger.log('Firebase Admin SDK initialized');
    } catch (e) {
      this.logger.error('Failed to initialize Firebase Admin SDK', e);
    }
  }

  async sendToToken(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.app) return;
    try {
      await admin.messaging(this.app).send({
        token: fcmToken,
        notification: { title, body },
        data,
        android: {
          priority: 'high',
          notification: { channelId: 'bello_horizonte_default' },
        },
      });
    } catch (e) {
      this.logger.warn(`FCM send failed: ${e}`);
    }
  }

  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
  ): Promise<{ sent: number; skipped: number }> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, fcmToken: { not: null } },
      select: { fcmToken: true },
    });

    let sent = 0;
    for (const user of users) {
      if (user.fcmToken) {
        await this.sendToToken(user.fcmToken, title, body);
        sent++;
      }
    }

    return { sent, skipped: userIds.length - sent };
  }

  async broadcast(
    title: string,
    body: string,
  ): Promise<{ sent: number; skipped: number }> {
    const users = await this.prisma.user.findMany({
      where: { fcmToken: { not: null } },
      select: { id: true, fcmToken: true },
    });

    let sent = 0;
    for (const user of users) {
      if (user.fcmToken) {
        await this.sendToToken(user.fcmToken, title, body);
        sent++;
      }
    }

    const total = await this.prisma.user.count();
    return { sent, skipped: total - sent };
  }

  async listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dni: true,
        fcmToken: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
  }
}
