import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  const count = await prisma.specialty.count();
  if (count > 0) {
    console.log('✅ Database already seeded, skipping.');
    return;
  }

  console.log('🌱 Starting database seed...');

  // ─── Specialties ────────────────────────────────────────────────────────────
  console.log('Creating specialties...');

  const specialtiesData = [
    {
      name: 'Cardiología',
      description: 'Diagnóstico y tratamiento de enfermedades del corazón y sistema cardiovascular.',
      icon: 'favorite',
      color: '#1565C0',
    },
    {
      name: 'Medicina General',
      description: 'Atención médica integral y preventiva para todas las edades.',
      icon: 'local_hospital',
      color: '#00897B',
    },
    {
      name: 'Ginecología',
      description: 'Salud femenina, embarazo y enfermedades del sistema reproductivo femenino.',
      icon: 'pregnant_woman',
      color: '#AD1457',
    },
    {
      name: 'Neurología',
      description: 'Diagnóstico y tratamiento de enfermedades del sistema nervioso.',
      icon: 'psychology',
      color: '#6A1B9A',
    },
    {
      name: 'Traumatología',
      description: 'Lesiones del aparato locomotor: huesos, músculos y articulaciones.',
      icon: 'accessibility_new',
      color: '#E65100',
    },
    {
      name: 'Dermatología',
      description: 'Enfermedades y tratamientos de la piel, cabello y uñas.',
      icon: 'face',
      color: '#00838F',
    },
    {
      name: 'Pediatría',
      description: 'Atención médica especializada para niños y adolescentes.',
      icon: 'child_care',
      color: '#2E7D32',
    },
    {
      name: 'Oftalmología',
      description: 'Diagnóstico y tratamiento de enfermedades de los ojos y la visión.',
      icon: 'visibility',
      color: '#4527A0',
    },
    {
      name: 'Urología',
      description: 'Enfermedades del sistema urinario y reproductivo masculino.',
      icon: 'medical_services',
      color: '#558B2F',
    },
    {
      name: 'Gastroenterología',
      description: 'Enfermedades del sistema digestivo: estómago, intestino, hígado y páncreas.',
      icon: 'restaurant',
      color: '#4E342E',
    },
    {
      name: 'Endocrinología',
      description: 'Trastornos hormonales, diabetes y enfermedades metabólicas.',
      icon: 'science',
      color: '#283593',
    },
    {
      name: 'Odontología',
      description: 'Salud bucal, tratamiento dental y estética oral.',
      icon: 'sentiment_very_satisfied',
      color: '#795548',
    },
  ];

  const specialties = await Promise.all(
    specialtiesData.map((s) => prisma.specialty.create({ data: s })),
  );

  const specialtyMap: Record<string, string> = {};
  specialties.forEach((s) => {
    specialtyMap[s.name] = s.id;
  });

  console.log(`✅ Created ${specialties.length} specialties`);

  // ─── Doctors ─────────────────────────────────────────────────────────────────
  console.log('Creating doctors...');

  const doctorsData = [
    {
      firstName: 'Carlos',
      lastName: 'Mendoza Ríos',
      specialtyName: 'Cardiología',
      description: 'Cardiólogo con más de 15 años de experiencia en el diagnóstico y tratamiento de enfermedades cardiovasculares.',
      rating: 4.8,
      yearsExperience: 15,
      consultationFee: 120.0,
      availableDays: [1, 2, 3, 4, 5],
    },
    {
      firstName: 'María',
      lastName: 'García Villanueva',
      specialtyName: 'Medicina General',
      description: 'Médico general con enfoque en medicina preventiva y atención primaria de salud.',
      rating: 4.6,
      yearsExperience: 10,
      consultationFee: 80.0,
      availableDays: [1, 2, 3, 4, 5, 6],
    },
    {
      firstName: 'Ana',
      lastName: 'Torres Huamán',
      specialtyName: 'Ginecología',
      description: 'Ginecóloga especialista en obstetricia y salud reproductiva femenina.',
      rating: 4.9,
      yearsExperience: 12,
      consultationFee: 110.0,
      availableDays: [1, 2, 3, 4, 5],
    },
    {
      firstName: 'Roberto',
      lastName: 'Llanos Paredes',
      specialtyName: 'Neurología',
      description: 'Neurólogo experto en trastornos del sistema nervioso central y periférico.',
      rating: 4.7,
      yearsExperience: 18,
      consultationFee: 130.0,
      availableDays: [1, 3, 5],
    },
    {
      firstName: 'Jorge',
      lastName: 'Castillo Medina',
      specialtyName: 'Traumatología',
      description: 'Traumatólogo especializado en cirugía ortopédica y rehabilitación del aparato locomotor.',
      rating: 4.5,
      yearsExperience: 14,
      consultationFee: 115.0,
      availableDays: [1, 2, 4, 5],
    },
    {
      firstName: 'Lucía',
      lastName: 'Ramírez Chávez',
      specialtyName: 'Dermatología',
      description: 'Dermatóloga con experiencia en dermatología clínica, cosmética y cirugía dermatológica.',
      rating: 4.8,
      yearsExperience: 9,
      consultationFee: 100.0,
      availableDays: [2, 3, 4, 5, 6],
    },
    {
      firstName: 'Pedro',
      lastName: 'Flores Sánchez',
      specialtyName: 'Pediatría',
      description: 'Pediatra dedicado a la atención integral de niños desde el nacimiento hasta la adolescencia.',
      rating: 4.9,
      yearsExperience: 11,
      consultationFee: 90.0,
      availableDays: [1, 2, 3, 4, 5],
    },
    {
      firstName: 'Carmen',
      lastName: 'Vega Morales',
      specialtyName: 'Oftalmología',
      description: 'Oftalmóloga especialista en cirugía refractiva y tratamiento de enfermedades oculares.',
      rating: 4.7,
      yearsExperience: 13,
      consultationFee: 105.0,
      availableDays: [1, 2, 3, 5],
    },
    {
      firstName: 'Luis',
      lastName: 'Quispe Mamani',
      specialtyName: 'Urología',
      description: 'Urólogo experto en enfermedades del tracto urinario y sistema reproductivo masculino.',
      rating: 4.6,
      yearsExperience: 16,
      consultationFee: 120.0,
      availableDays: [1, 3, 4, 5],
    },
    {
      firstName: 'Rosa',
      lastName: 'Espinoza Campos',
      specialtyName: 'Gastroenterología',
      description: 'Gastroenteróloga especializada en enfermedades digestivas y procedimientos endoscópicos.',
      rating: 4.8,
      yearsExperience: 17,
      consultationFee: 125.0,
      availableDays: [2, 3, 4, 5],
    },
    {
      firstName: 'Miguel',
      lastName: 'Herrera Zuñiga',
      specialtyName: 'Endocrinología',
      description: 'Endocrinólogo especialista en diabetes, tiroides y trastornos metabólicos y hormonales.',
      rating: 4.7,
      yearsExperience: 20,
      consultationFee: 130.0,
      availableDays: [1, 2, 4, 5],
    },
    {
      firstName: 'Patricia',
      lastName: 'Salinas Vargas',
      specialtyName: 'Odontología',
      description: 'Odontóloga con especialización en ortodoncia y estética dental.',
      rating: 4.9,
      yearsExperience: 8,
      consultationFee: 85.0,
      availableDays: [1, 2, 3, 4, 5, 6],
    },
    {
      firstName: 'Eduardo',
      lastName: 'Ramos Tapia',
      specialtyName: 'Cardiología',
      description: 'Cardiólogo intervencionista con experiencia en cateterismo cardíaco y angioplastia.',
      rating: 4.6,
      yearsExperience: 22,
      consultationFee: 140.0,
      availableDays: [1, 2, 3, 4],
    },
    {
      firstName: 'Diana',
      lastName: 'Ponce Albújar',
      specialtyName: 'Medicina General',
      description: 'Médico general con enfoque en medicina familiar y atención a pacientes crónicos.',
      rating: 4.5,
      yearsExperience: 7,
      consultationFee: 75.0,
      availableDays: [1, 3, 5, 6],
    },
    {
      firstName: 'Andrés',
      lastName: 'Cruz Benítez',
      specialtyName: 'Neurología',
      description: 'Neurólogo especializado en epilepsia, cefaleas y trastornos del sueño.',
      rating: 4.8,
      yearsExperience: 13,
      consultationFee: 135.0,
      availableDays: [2, 4, 5],
    },
  ];

  const doctors = await Promise.all(
    doctorsData.map((d) => {
      const { specialtyName, ...rest } = d;
      return prisma.doctor.create({
        data: {
          ...rest,
          specialtyId: specialtyMap[specialtyName],
        },
      });
    }),
  );

  console.log(`✅ Created ${doctors.length} doctors`);

  // ─── Users ───────────────────────────────────────────────────────────────────
  console.log('Creating users...');

  const demoPasswordHash = await bcrypt.hash('demo123', SALT_ROUNDS);
  const adminPasswordHash = await bcrypt.hash('admin123', SALT_ROUNDS);

  const demoUser = await prisma.user.create({
    data: {
      dni: '00000000',
      email: 'demo@bellohorizonte.pe',
      phone: '987654321',
      firstName: 'Demo',
      lastName: 'Usuario',
      birthDate: '1990-05-15',
      passwordHash: demoPasswordHash,
      role: Role.USER,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      dni: '11111111',
      email: 'admin@bellohorizonte.pe',
      phone: '999888777',
      firstName: 'Admin',
      lastName: 'Clínica',
      birthDate: '1985-03-20',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`✅ Created demo user: ${demoUser.email}`);
  console.log(`✅ Created admin user: ${adminUser.email}`);

  // ─── Patient Records ─────────────────────────────────────────────────────────
  console.log('Creating patient records...');

  const firstDoctor = doctors[0];
  const secondDoctor = doctors[1];
  const thirdDoctor = doctors[6];

  const patientRecords = await Promise.all([
    prisma.patientRecord.create({
      data: {
        userId: demoUser.id,
        diagnosis: 'Hipertensión arterial leve',
        treatment: 'Tratamiento farmacológico con Enalapril 10mg/día. Dieta baja en sodio y ejercicio moderado.',
        notes: 'Paciente responde bien al tratamiento. Control mensual recomendado.',
        recordDate: '2024-01-15',
        doctorName: `${firstDoctor.firstName} ${firstDoctor.lastName}`,
        specialtyName: 'Cardiología',
      },
    }),
    prisma.patientRecord.create({
      data: {
        userId: demoUser.id,
        diagnosis: 'Infección respiratoria aguda',
        treatment: 'Amoxicilina 500mg cada 8 horas por 7 días. Reposo y abundante líquido.',
        notes: 'Evolución favorable. No se requiere seguimiento adicional salvo persistencia de síntomas.',
        recordDate: '2024-02-28',
        doctorName: `${secondDoctor.firstName} ${secondDoctor.lastName}`,
        specialtyName: 'Medicina General',
      },
    }),
    prisma.patientRecord.create({
      data: {
        userId: demoUser.id,
        diagnosis: 'Control pediátrico de rutina',
        treatment: 'Vacunación al día. Desarrollo psicomotor normal para la edad.',
        notes: 'Paciente en excelente estado de salud. Próxima consulta en 6 meses.',
        recordDate: '2024-03-10',
        doctorName: `${thirdDoctor.firstName} ${thirdDoctor.lastName}`,
        specialtyName: 'Pediatría',
      },
    }),
  ]);

  console.log(`✅ Created ${patientRecords.length} patient records`);

  console.log('\n🎉 Database seed completed successfully!\n');
  console.log('─────────────────────────────────────────');
  console.log('Demo credentials:');
  console.log('  Email:    demo@bellohorizonte.pe');
  console.log('  DNI:      00000000');
  console.log('  Password: demo123');
  console.log('');
  console.log('Admin credentials:');
  console.log('  Email:    admin@bellohorizonte.pe');
  console.log('  DNI:      11111111');
  console.log('  Password: admin123');
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
