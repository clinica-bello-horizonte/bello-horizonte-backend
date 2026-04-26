import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(config.get('RESEND_API_KEY'));
    this.from = config.get('RESEND_FROM') ?? 'Clínica Bello Horizonte <onboarding@resend.dev>';
  }

  async sendPasswordReset(to: string, firstName: string, code: string) {
    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject: 'Restablecer contraseña — Clínica Bello Horizonte',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#f8fafc;border-radius:12px">
            <h2 style="color:#1a56db;margin-bottom:8px">Clínica Bello Horizonte</h2>
            <p style="color:#374151">Hola, <strong>${firstName}</strong>.</p>
            <p style="color:#374151">Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código:</p>
            <div style="background:#fff;border:2px solid #1a56db;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
              <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1a56db">${code}</span>
            </div>
            <p style="color:#6b7280;font-size:13px">Este código expira en <strong>15 minutos</strong>. Si no solicitaste esto, ignora este correo.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
            <p style="color:#9ca3af;font-size:12px">Clínica Bello Horizonte · Piura, Perú</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error('Error al enviar email:', err);
    }
  }
}
