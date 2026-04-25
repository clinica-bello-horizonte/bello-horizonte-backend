import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting database seed...');

  // Borra referencia data en orden seguro
  await (prisma as any).doctorRating?.deleteMany().catch(() => {});
  await prisma.patientRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.specialty.deleteMany();
  // Elimina usuarios doctor del seed anterior (no usuarios reales)
  await prisma.user.deleteMany({
    where: { email: { endsWith: '.doctor@bellohorizonte.pe' } },
  });

  // ─── Specialties ────────────────────────────────────────────────────────────
  console.log('Creating specialties...');

  const specialtiesData = [
    { name: 'Cardiología', description: 'Diagnóstico y tratamiento de enfermedades del corazón y sistema circulatorio. Contamos con los mejores especialistas y tecnología de punta.', icon: 'heart', color: '#1565C0' },
    { name: 'Medicina General', description: 'Atención médica integral para toda la familia. Primera línea de atención para diagnóstico, tratamiento y prevención.', icon: 'stethoscope', color: '#00897B' },
    { name: 'Ginecología y Obstetricia', description: 'Atención especializada en salud femenina, embarazo, parto y período postparto. Cuidamos a la madre y al bebé.', icon: 'baby', color: '#AD1457' },
    { name: 'Neurología', description: 'Diagnóstico y tratamiento de enfermedades del sistema nervioso central y periférico. Migraña, epilepsia, Parkinson y más.', icon: 'brain', color: '#6A1B9A' },
    { name: 'Traumatología y Ortopedia', description: 'Atención de lesiones y enfermedades del sistema músculo-esquelético. Huesos, articulaciones, músculos y tendones.', icon: 'bone', color: '#E65100' },
    { name: 'Dermatología', description: 'Diagnóstico y tratamiento de enfermedades de la piel, cabello y uñas. Acné, psoriasis, alergias y más.', icon: 'skin', color: '#F06292' },
    { name: 'Pediatría', description: 'Atención médica especializada para niños desde el nacimiento hasta la adolescencia. Crecimiento, desarrollo y vacunas.', icon: 'child', color: '#2E7D32' },
    { name: 'Oftalmología', description: 'Diagnóstico y tratamiento de enfermedades de los ojos. Miopía, cataratas, glaucoma y más.', icon: 'eye', color: '#00838F' },
    { name: 'Urología', description: 'Atención de enfermedades del aparato urinario y sistema reproductor masculino.', icon: 'kidney', color: '#558B2F' },
    { name: 'Gastroenterología', description: 'Diagnóstico y tratamiento de enfermedades del sistema digestivo: estómago, intestinos, hígado y páncreas.', icon: 'stomach', color: '#4E342E' },
    { name: 'Endocrinología', description: 'Atención de trastornos hormonales y metabólicos. Diabetes, tiroides, obesidad y más.', icon: 'hormone', color: '#283593' },
    { name: 'Odontología', description: 'Atención dental integral: limpieza, caries, ortodoncia, implantes y más. Sonrisas saludables para toda la familia.', icon: 'tooth', color: '#00796B' },
  ];

  const specialties = await Promise.all(
    specialtiesData.map((s) => prisma.specialty.create({ data: s })),
  );

  const sm: Record<string, string> = {};
  specialties.forEach((s) => { sm[s.name] = s.id; });

  console.log(`✅ Created ${specialties.length} specialties`);

  // ─── Doctors ─────────────────────────────────────────────────────────────────
  console.log('Creating doctors...');

  const doctorsData = [
    // Cardiología
    { firstName: 'Deivis', lastName: 'Jaime Rodríguez', specialtyName: 'Cardiología', description: 'Cardiólogo con más de 15 años de experiencia en el tratamiento de enfermedades cardiovasculares. Especialista en ecocardiografía y arritmias.', rating: 4.9, yearsExperience: 15, consultationFee: 120.0, availableDays: [1,2,3,4,5] },
    { firstName: 'Jorge', lastName: 'Juárez Herrera', specialtyName: 'Cardiología', description: 'Especialista en cardiología intervencionista. Amplia experiencia en cateterismo cardíaco y angioplastia.', rating: 4.8, yearsExperience: 12, consultationFee: 110.0, availableDays: [1,3,5] },
    { firstName: 'Robert', lastName: 'Rivas Salcedo', specialtyName: 'Cardiología', description: 'Cardiólogo clínico con enfoque en prevención cardiovascular y rehabilitación cardíaca.', rating: 4.7, yearsExperience: 10, consultationFee: 100.0, availableDays: [2,4,6] },
    // Medicina General
    { firstName: 'María Elena', lastName: 'Torres Vásquez', specialtyName: 'Medicina General', description: 'Médico general con amplia experiencia en atención primaria. Especializada en medicina familiar y preventiva.', rating: 4.8, yearsExperience: 8, consultationFee: 80.0, availableDays: [1,2,3,4,5,6] },
    { firstName: 'Carlos', lastName: 'Mendoza Ríos', specialtyName: 'Medicina General', description: 'Médico general con formación en emergencias y medicina interna. Atiende a pacientes de todas las edades.', rating: 4.6, yearsExperience: 6, consultationFee: 80.0, availableDays: [1,2,3,4,5] },
    // Ginecología y Obstetricia
    { firstName: 'Daniel', lastName: 'Valera Campos', specialtyName: 'Ginecología y Obstetricia', description: 'Ginecólogo obstetra con más de 20 años de experiencia. Especialista en embarazos de alto riesgo y cirugía ginecológica.', rating: 4.9, yearsExperience: 20, consultationFee: 130.0, availableDays: [1,2,3,4,5] },
    { firstName: 'Wilder', lastName: 'Córdova Zapata', specialtyName: 'Ginecología y Obstetricia', description: 'Especialista en ginecología endocrinológica y reproducción asistida. Amplia experiencia en laparoscopía.', rating: 4.7, yearsExperience: 14, consultationFee: 120.0, availableDays: [2,4,6] },
    // Neurología
    { firstName: 'Patricia', lastName: 'Luna Castillo', specialtyName: 'Neurología', description: 'Neuróloga especialista en cefaleas, epilepsia y enfermedades neurodegenerativas. 12 años de experiencia clínica.', rating: 4.8, yearsExperience: 12, consultationFee: 140.0, availableDays: [1,3,5] },
    // Traumatología y Ortopedia
    { firstName: 'Ricardo', lastName: 'Castro Villanueva', specialtyName: 'Traumatología y Ortopedia', description: 'Traumatólogo cirujano especialista en cirugía artroscópica de rodilla y hombro. Experto en lesiones deportivas.', rating: 4.9, yearsExperience: 18, consultationFee: 130.0, availableDays: [1,2,3,4,5] },
    // Dermatología
    { firstName: 'Lucía', lastName: 'Paredes Soto', specialtyName: 'Dermatología', description: 'Dermatóloga con especialización en dermatología estética y cosmética. Experta en tratamiento de acné y envejecimiento.', rating: 4.7, yearsExperience: 9, consultationFee: 110.0, availableDays: [2,4,6] },
    // Pediatría
    { firstName: 'Ana Rosa', lastName: 'Gutiérrez Polo', specialtyName: 'Pediatría', description: 'Pediatra con subespecialidad en neonatología. Amplia experiencia en atención de recién nacidos y niños hasta 18 años.', rating: 4.9, yearsExperience: 16, consultationFee: 90.0, availableDays: [1,2,3,4,5,6] },
    // Oftalmología
    { firstName: 'Fernando', lastName: 'Reyes Morales', specialtyName: 'Oftalmología', description: 'Oftalmólogo especialista en cirugía refractiva y tratamiento del glaucoma. Más de 10 años de experiencia.', rating: 4.8, yearsExperience: 10, consultationFee: 120.0, availableDays: [1,3,5] },
    // Gastroenterología
    { firstName: 'Miguel', lastName: 'Chávez Ramírez', specialtyName: 'Gastroenterología', description: 'Gastroenterólogo con experiencia en endoscopía digestiva. Especialista en enfermedades inflamatorias intestinales.', rating: 4.7, yearsExperience: 13, consultationFee: 130.0, availableDays: [2,4] },
    // Endocrinología
    { firstName: 'Gloria', lastName: 'Sánchez Flores', specialtyName: 'Endocrinología', description: 'Endocrinóloga especialista en diabetes mellitus, enfermedades tiroideas y trastornos metabólicos.', rating: 4.8, yearsExperience: 11, consultationFee: 120.0, availableDays: [1,2,3,4,5] },
    // Odontología
    { firstName: 'Jorge Luis', lastName: 'Alva Peña', specialtyName: 'Odontología', description: 'Odontólogo general con especialidad en ortodoncia y estética dental. Implantes dentales y blanqueamiento.', rating: 4.6, yearsExperience: 7, consultationFee: 90.0, availableDays: [1,2,3,4,5,6] },
  ];

  // Crear usuarios doctor y vincularlos
  const doctorPasswordHash = await bcrypt.hash('doctor123', SALT_ROUNDS);

  const doctors = await Promise.all(
    doctorsData.map(async ({ specialtyName, ...rest }, index) => {
      const emailKey = `${rest.firstName.toLowerCase().replace(/\s+/g, '.')}.${rest.lastName.toLowerCase().split(' ')[0]}`;
      const dni = `2000000${String(index).padStart(2, '0')}`;
      const doctorUser = await prisma.user.create({
        data: {
          dni,
          email: `${emailKey}.doctor@bellohorizonte.pe`,
          phone: `98700000${String(index).padStart(2, '0')}`,
          firstName: rest.firstName,
          lastName: rest.lastName,
          passwordHash: doctorPasswordHash,
          role: Role.DOCTOR,
        },
      });
      return prisma.doctor.create({
        data: { ...rest, specialtyId: sm[specialtyName], userId: doctorUser.id },
      });
    }),
  );

  console.log(`✅ Created ${doctors.length} doctors with user accounts`);
  console.log('Doctor login: <nombre>.<apellido>.doctor@bellohorizonte.pe / doctor123');

  // ─── Users ───────────────────────────────────────────────────────────────────
  console.log('Creating users...');

  const demoPasswordHash = await bcrypt.hash('demo123', SALT_ROUNDS);
  const adminPasswordHash = await bcrypt.hash('admin123', SALT_ROUNDS);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@bellohorizonte.pe' },
    update: {},
    create: { dni: '00000000', email: 'demo@bellohorizonte.pe', phone: '987654321', firstName: 'Demo', lastName: 'Usuario', birthDate: '1990-05-15', passwordHash: demoPasswordHash, role: Role.USER },
  });

  await prisma.user.upsert({
    where: { email: 'admin@bellohorizonte.pe' },
    update: {},
    create: { dni: '11111111', email: 'admin@bellohorizonte.pe', phone: '999888777', firstName: 'Admin', lastName: 'Clínica', birthDate: '1985-03-20', passwordHash: adminPasswordHash, role: Role.ADMIN },
  });

  console.log(`✅ Created demo user: ${demoUser.email}`);

  // ─── Patient Records ─────────────────────────────────────────────────────────
  console.log('Creating patient records...');

  await Promise.all([
    prisma.patientRecord.create({ data: { userId: demoUser.id, diagnosis: 'Hipertensión arterial leve', treatment: 'Se prescribe losartán 50mg una vez al día. Dieta baja en sodio y ejercicio regular.', notes: 'Paciente refiere cefalea ocasional. Presión arterial: 145/90 mmHg. Control en 30 días.', recordDate: '2024-08-15', doctorName: 'Dr. Deivis Jaime Rodríguez', specialtyName: 'Cardiología' } }),
    prisma.patientRecord.create({ data: { userId: demoUser.id, diagnosis: 'Infección respiratoria aguda', treatment: 'Amoxicilina 500mg cada 8 horas por 7 días. Ibuprofeno 400mg si hay fiebre.', notes: 'Tos productiva y fiebre de 38.5°C. Rx tórax normal. Reposo relativo.', recordDate: '2024-10-03', doctorName: 'Dra. María Elena Torres Vásquez', specialtyName: 'Medicina General' } }),
    prisma.patientRecord.create({ data: { userId: demoUser.id, diagnosis: 'Esguince de tobillo grado II', treatment: 'Vendaje compresivo, RICE (reposo, hielo, compresión, elevación). Diclofenaco 50mg.', notes: 'Lesión durante práctica deportiva. No fractura en Rx. Fisioterapia recomendada.', recordDate: '2024-11-20', doctorName: 'Dr. Ricardo Castro Villanueva', specialtyName: 'Traumatología y Ortopedia' } }),
  ]);

  console.log('✅ Created 3 patient records');
  console.log('\n🎉 Database seed completed successfully!\n');
  console.log('Demo →  dni: 00000000 / email: demo@bellohorizonte.pe / password: demo123');
  console.log('Admin → dni: 11111111 / email: admin@bellohorizonte.pe / password: admin123\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
