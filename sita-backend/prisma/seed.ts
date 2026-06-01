import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.notification.deleteMany().catch(() => {});
  await prisma.errorBookmark.deleteMany().catch(() => {});
  await prisma.sessionLog.deleteMany().catch(() => {});
  await prisma.studentParent.deleteMany().catch(() => {});
  await prisma.halaqahStudent.deleteMany().catch(() => {});
  await prisma.classroomStudent.deleteMany().catch(() => {});
  await prisma.classroom.deleteMany().catch(() => {});
  await prisma.academicYear.deleteMany().catch(() => {});
  await prisma.halaqah.deleteMany().catch(() => {});
  await prisma.certificate.deleteMany().catch(() => {});
  await prisma.juziyahExam.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});
  await prisma.hafalanLevel.deleteMany().catch(() => {});
  await prisma.scoringConfig.deleteMany().catch(() => {});
  await prisma.ayah.deleteMany().catch(() => {});
  await prisma.surah.deleteMany().catch(() => {});
  await prisma.whiteLabelConfig.deleteMany().catch(() => {});

  console.log('Cleared database.');

  // Create Users
  const passwordHash = bcrypt.hashSync('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin SITA',
      email: 'admin@sita.id',
      passwordHash,
      role: 'admin',
    },
  });

  const ustadz = await prisma.user.create({
    data: {
      name: 'Ustadz Hamid',
      email: 'ustadz@sita.id',
      passwordHash,
      role: 'ustadz',
    },
  });

  const koordinator = await prisma.user.create({
    data: {
      name: 'Ustadzah Sarah (Koordinator)',
      email: 'koordinator@sita.id',
      passwordHash,
      role: 'koordinator',
    },
  });
  console.log('Created coordinator:', koordinator.email);

  // Create Hafalan Levels
  const level1 = await prisma.hafalanLevel.create({
    data: {
      name: 'Level 1 - Juz 30',
      juzCount: 1,
      juzList: '30',
      targetDays: 30,
    }
  });

  await prisma.hafalanLevel.create({
    data: {
      name: 'Level 2 - Juz 29 & 30',
      juzCount: 2,
      juzList: '29,30',
      targetDays: 60,
    }
  });

  await prisma.hafalanLevel.create({
    data: {
      name: 'Level 3 - Juz 28 s.d. 30',
      juzCount: 3,
      juzList: '28,29,30',
      targetDays: 90,
    }
  });

  console.log('Created default memorization levels.');

  const student = await prisma.user.create({
    data: {
      name: 'Fatimah',
      email: 'student@sita.id',
      passwordHash,
      role: 'student',
      nis: '12345',
      levelId: level1.id,
    },
  });

  const parent = await prisma.user.create({
    data: {
      name: 'Bapak Rizal',
      email: 'parent@sita.id',
      passwordHash,
      role: 'parent',
    },
  });

  console.log('Created mock users.');

  // Create Halaqah
  const halaqah = await prisma.halaqah.create({
    data: {
      name: 'Kelas Tahfidz A',
      ustadzId: ustadz.id,
      description: 'Kelompok tahfidz reguler tingkat menengah',
    },
  });

  // Assign Student to Halaqah
  await prisma.halaqahStudent.create({
    data: {
      halaqahId: halaqah.id,
      studentId: student.id,
    },
  });

  // Connect Student to Parent
  await prisma.studentParent.create({
    data: {
      studentId: student.id,
      parentId: parent.id,
      relationship: 'ayah',
    },
  });

  console.log('Assigned halaqah and parents.');

  // Create default Academic Year
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2025/2026',
      isActive: true,
    },
  });
  console.log('Created active academic year: 2025/2026');

  // Create default Classrooms
  const classroom1 = await prisma.classroom.create({
    data: {
      name: 'Kelas X-A',
      academicYearId: academicYear.id,
    },
  });
  await prisma.classroom.create({
    data: {
      name: 'Kelas XI-A',
      academicYearId: academicYear.id,
    },
  });
  console.log('Created default classrooms.');

  // Enroll Student to Classroom
  await prisma.classroomStudent.create({
    data: {
      classroomId: classroom1.id,
      studentId: student.id,
    },
  });
  console.log('Assigned student Fatimah to Kelas X-A');

  // Create default Scoring Config
  await prisma.scoringConfig.create({
    data: {
      scoreInitial: 100,
      penaltyJali: 3,
      penaltyKhafi: 1,
      penaltyTark: 2,
      passThreshold: 80,
      updatedBy: admin.id,
    },
  });

  console.log('Created default scoring configuration.');

  // Create default White Label Config
  await prisma.whiteLabelConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      appName: 'SITA Tahfidz',
      footerText: 'Sistem Digital Setoran Tahfidz',
    },
  });

  console.log('Created default white label configuration.');

  // Read Surah & Ayah data from the frontend JSON files
  const surahsPath = path.join(__dirname, '..', '..', 'sita-frontend', 'public', 'data', 'surahs.json');
  const ayahsPath = path.join(__dirname, '..', '..', 'sita-frontend', 'public', 'data', 'ayahs.json');

  if (fs.existsSync(surahsPath) && fs.existsSync(ayahsPath)) {
    const surahsData = JSON.parse(fs.readFileSync(surahsPath, 'utf-8'));
    const ayahsData = JSON.parse(fs.readFileSync(ayahsPath, 'utf-8'));

    console.log(`Seeding ${surahsData.length} surahs and ${ayahsData.length} ayahs...`);

    // Use createMany for speed
    await prisma.surah.createMany({
      data: surahsData.map((s: any) => ({
        id: s.id,
        nameAr: s.name_ar,
        nameEn: s.name_en,
      })),
    });

    await prisma.ayah.createMany({
      data: ayahsData.map((a: any) => ({
        id: a.id,
        surahId: a.surah_id,
        ayahId: a.ayah_id,
        text: a.text,
      })),
    });

    console.log(`Successfully seeded ${surahsData.length} surahs and ${ayahsData.length} ayahs from JSON.`);
  } else {
    console.log('JSON files not found. Skipping Quran text seeding.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
