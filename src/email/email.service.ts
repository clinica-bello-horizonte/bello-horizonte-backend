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

  /**
   * Notifica a la clínica una solicitud de cambio de fecha de nacimiento
   * (cuando el dato ya está bloqueado). El personal valida y actualiza manualmente.
   */
  async sendBirthDateChangeRequest(req: {
    firstName: string;
    lastName: string;
    dni: string;
    email: string;
    phone: string;
    currentBirthDate: string | null;
    requestedBirthDate: string;
    reason?: string;
  }) {
    const clinicEmail =
      this.config.get('CLINIC_EMAIL') ?? 'contacto@bellohorizonte.pe';
    try {
      await this.resend.emails.send({
        from: this.from,
        to: clinicEmail,
        replyTo: req.email,
        subject: `Solicitud de cambio de fecha de nacimiento — ${req.firstName} ${req.lastName}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px 24px;background:#f8fafc;border-radius:12px">
            <h2 style="color:#1a56db;margin-bottom:8px">Clínica Bello Horizonte</h2>
            <p style="color:#374151">Un usuario solicita cambiar su <strong>fecha de nacimiento</strong> (dato bloqueado). Verifiquen su identidad antes de actualizarlo.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;color:#374151;font-size:14px">
              <tr><td style="padding:6px 0"><strong>Paciente</strong></td><td>${req.firstName} ${req.lastName}</td></tr>
              <tr><td style="padding:6px 0"><strong>DNI</strong></td><td>${req.dni}</td></tr>
              <tr><td style="padding:6px 0"><strong>Correo</strong></td><td>${req.email}</td></tr>
              <tr><td style="padding:6px 0"><strong>Teléfono</strong></td><td>${req.phone}</td></tr>
              <tr><td style="padding:6px 0"><strong>Fecha actual</strong></td><td>${req.currentBirthDate ?? '(sin registrar)'}</td></tr>
              <tr><td style="padding:6px 0"><strong>Fecha solicitada</strong></td><td style="color:#1a56db;font-weight:bold">${req.requestedBirthDate}</td></tr>
              ${req.reason ? `<tr><td style="padding:6px 0"><strong>Motivo</strong></td><td>${req.reason}</td></tr>` : ''}
            </table>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
            <p style="color:#9ca3af;font-size:12px">Clínica Bello Horizonte · Piura, Perú</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error('Error al enviar solicitud de cambio de fecha:', err);
      throw err;
    }
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
