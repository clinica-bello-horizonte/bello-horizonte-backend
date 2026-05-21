import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

const SPANISH_MONTHS: Record<string, string> = {
  enero: '01', febrero: '02', marzo: '03', abril: '04',
  mayo: '05', junio: '06', julio: '07', agosto: '08',
  septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
};

const MONTH_NAMES = Object.keys(SPANISH_MONTHS);

export interface SupabaseAppointmentParams {
  bellohorizonteId: string;
  doctorName: string;
  patientName: string;
  patientDni: string;
  contactPhone: string;
  appointmentDate: string; // ISO: "2026-05-20"
  appointmentTime: string; // 24h: "18:30"
  reason: string;
}

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  constructor(
    @Inject('SUPABASE_CLIENT') private readonly client: SupabaseClient | null,
  ) {}

  // "20 de mayo de 2026" → "2026-05-20"
  parseDateSpanish(dateStr: string): string | null {
    const match = dateStr?.match(/(\d{1,2}) de (\w+) de (\d{4})/i);
    if (!match) return null;
    const [, day, month, year] = match;
    const monthNum = SPANISH_MONTHS[month.toLowerCase()];
    if (!monthNum) return null;
    return `${year}-${monthNum}-${day.padStart(2, '0')}`;
  }

  // "2026-05-20" → "20 de mayo de 2026"
  formatDateSpanish(isoDate: string): string {
    const [year, month, day] = isoDate.split('-');
    return `${parseInt(day)} de ${MONTH_NAMES[parseInt(month) - 1]} de ${year}`;
  }

  // "6:30 pm" → "18:30"
  parseTime12h(timeStr: string): string | null {
    const match = timeStr?.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (!match) return null;
    const [, hours, minutes, period] = match;
    let h = parseInt(hours);
    if (period.toLowerCase() === 'pm' && h !== 12) h += 12;
    if (period.toLowerCase() === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${minutes}`;
  }

  // "18:30" → "6:30 pm"
  formatTime12h(time24: string): string {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  }

  async getBookedTimesFromSupabase(doctorName: string, dateSpanish: string): Promise<string[]> {
    if (!this.client) return [];
    try {
      const { data, error } = await this.client
        .from('appointments')
        .select('appointment_time')
        .ilike('doctor_name', doctorName)
        .eq('appointment_date', dateSpanish)
        .or('source.neq.bello_horizonte,source.is.null');

      if (error) {
        this.logger.error('Error consultando slots en Supabase', error.message);
        return [];
      }

      return (data ?? [])
        .map((r: any) => this.parseTime12h(r.appointment_time))
        .filter((t): t is string => t !== null);
    } catch (e) {
      this.logger.error('Fallo al consultar Supabase', e);
      return [];
    }
  }

  async writeAppointmentToSupabase(params: SupabaseAppointmentParams): Promise<void> {
    if (!this.client) return;
    try {
      const { error } = await this.client.from('appointments').insert({
        id: params.bellohorizonteId,
        patient_name: params.patientName,
        patient_dni: params.patientDni,
        contact_phone: params.contactPhone,
        doctor_name: params.doctorName,
        appointment_date: this.formatDateSpanish(params.appointmentDate),
        appointment_time: this.formatTime12h(params.appointmentTime),
        reason: params.reason,
        source: 'bello_horizonte',
      });

      if (error) this.logger.error('Error escribiendo cita en Supabase', error.message);
    } catch (e) {
      this.logger.error('Fallo al escribir en Supabase', e);
    }
  }

  async deleteAppointmentFromSupabase(id: string): Promise<void> {
    if (!this.client) return;
    try {
      const { error } = await this.client
        .from('appointments')
        .delete()
        .eq('id', id)
        .eq('source', 'bello_horizonte');

      if (error) this.logger.error('Error eliminando cita en Supabase', error.message);
    } catch (e) {
      this.logger.error('Fallo al eliminar en Supabase', e);
    }
  }
}
