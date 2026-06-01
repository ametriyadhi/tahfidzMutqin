import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Request Juziyah Exam (Called by Ustadz)
export const requestJuziyahExam = async (req: AuthRequest, res: Response) => {
  const { studentId, juzId } = req.body;
  const ustadzId = req.user?.id;

  if (!ustadzId) {
    return res.status(401).json({ error: 'Tidak terautentikasi' });
  }

  if (!studentId || !juzId) {
    return res.status(400).json({ error: 'studentId dan juzId harus diisi' });
  }

  try {
    // Check if student exists
    const student = await prisma.user.findUnique({
      where: { id: Number(studentId), role: 'student' },
    });

    if (!student) {
      return res.status(404).json({ error: 'Santri tidak ditemukan' });
    }

    // Check if there is already a pending exam for this student and Juz
    const existingPending = await prisma.juziyahExam.findFirst({
      where: {
        studentId: Number(studentId),
        juzId: Number(juzId),
        status: 'pending',
      },
    });

    if (existingPending) {
      return res.status(400).json({ error: 'Ujian Juziyah untuk Juz ini sedang diajukan dan berstatus pending' });
    }

    // Create JuziyahExam request
    const exam = await prisma.juziyahExam.create({
      data: {
        studentId: Number(studentId),
        ustadzId: ustadzId,
        juzId: Number(juzId),
        status: 'pending',
      },
      include: {
        student: { select: { id: true, name: true } },
        ustadz: { select: { id: true, name: true } },
      },
    });

    // Create system notification for Coordinator
    // Find coordinators
    const coordinators = await prisma.user.findMany({
      where: { role: 'koordinator', isActive: true },
    });

    for (const coord of coordinators) {
      await prisma.notification.create({
        data: {
          recipientId: coord.id,
          type: 'ujian_juziyah_baru',
          title: 'Pengajuan Ujian Juziyah Baru',
          body: `Ustadz ${req.user?.name} mengajukan Ujian Juziyah ${juzId} untuk santri ${student.name}.`,
          data: JSON.stringify({ examId: exam.id, studentId: student.id, juzId }),
        },
      });
    }

    return res.status(201).json({ message: 'Ujian Juziyah berhasil diajukan', exam });
  } catch (error) {
    console.error('Error requesting juziyah exam:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

// 2. Get Pending Juziyah Exams (Called by Coordinator)
export const getPendingJuziyahExams = async (_req: AuthRequest, res: Response) => {
  try {
    const pendingExams = await prisma.juziyahExam.findMany({
      where: { status: 'pending' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            nis: true,
            avatarUrl: true,
            level: { select: { name: true } },
          },
        },
        ustadz: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(pendingExams);
  } catch (error) {
    console.error('Error fetching pending exams:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

// 3. Submit Exam Result (Called by Coordinator)
export const submitJuziyahExamResult = async (req: AuthRequest, res: Response) => {
  const { examId, score, status, notes } = req.body;

  if (!examId || score === undefined || !status) {
    return res.status(400).json({ error: 'examId, score, dan status harus diisi' });
  }

  if (status !== 'lulus' && status !== 'mengulang') {
    return res.status(400).json({ error: 'Status harus bernilai "lulus" atau "mengulang"' });
  }

  try {
    const exam = await prisma.juziyahExam.findUnique({
      where: { id: examId },
      include: {
        student: true,
        ustadz: true,
      },
    });

    if (!exam) {
      return res.status(404).json({ error: 'Pengajuan ujian tidak ditemukan' });
    }

    // Update JuziyahExam
    const updatedExam = await prisma.juziyahExam.update({
      where: { id: examId },
      data: {
        score: Number(score),
        status,
        notes: notes || null,
      },
    });

    let certificate = null;

    if (status === 'lulus') {
      // Generate premium Certificate Number: SITA/CERT/YYYY/MM/NNNN
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');

      // Get count of certificates created in this month to increment serial
      const countThisMonth = await prisma.certificate.count({
        where: {
          issuedAt: {
            gte: new Date(year, now.getMonth(), 1),
            lt: new Date(year, now.getMonth() + 1, 1),
          },
        },
      });

      const serial = String(countThisMonth + 1).padStart(4, '0');
      const certificateNo = `SITA/CERT/${year}/${month}/${serial}`;

      // Create Certificate
      certificate = await prisma.certificate.create({
        data: {
          examId: exam.id,
          certificateNo,
        },
      });

      // Send congratulatory notification to Student and Parent
      await prisma.notification.create({
        data: {
          recipientId: exam.studentId,
          type: 'ujian_juziyah_lulus',
          title: 'Selamat! Lulus Ujian Juziyah 🎉',
          body: `Barakallah! Anda dinyatakan LULUS Ujian Juziyah Juz ${exam.juzId} dengan skor ${score}. Sertifikat Anda telah terbit!`,
          data: JSON.stringify({ examId: exam.id, certificateNo }),
        },
      });

      // Notify parent if linked
      const studentParents = await prisma.studentParent.findMany({
        where: { studentId: exam.studentId },
      });

      for (const sp of studentParents) {
        await prisma.notification.create({
          data: {
            recipientId: sp.parentId,
            type: 'anak_ujian_juziyah_lulus',
            title: 'Ananda Lulus Ujian Juziyah 🎉',
            body: `Barakallah! Ananda ${exam.student.name} dinyatakan LULUS Ujian Juziyah Juz ${exam.juzId} dengan skor ${score}.`,
            data: JSON.stringify({ examId: exam.id, studentName: exam.student.name, certificateNo }),
          },
        });
      }
    } else {
      // Notify about need to repeat
      await prisma.notification.create({
        data: {
          recipientId: exam.studentId,
          type: 'ujian_juziyah_mengulang',
          title: 'Hasil Ujian Juziyah: Belum Lulus',
          body: `Tetap semangat! Anda perlu mengulang Ujian Juziyah Juz ${exam.juzId}. Catatan penguji: "${notes || '-'}"`,
          data: JSON.stringify({ examId: exam.id }),
        },
      });
    }

    return res.json({
      message: status === 'lulus' ? 'Hasil ujian berhasil disimpan dan sertifikat diterbitkan' : 'Hasil ujian disimpan (Mengulang)',
      exam: updatedExam,
      certificate,
    });
  } catch (error) {
    console.error('Error submitting exam result:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

// 4. Get Certificates (Called by any authenticated user related to the certificate)
export const getCertificates = async (req: AuthRequest, res: Response) => {
  const { studentId } = req.query;
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: 'Tidak terautentikasi' });
  }

  try {
    let whereClause: any = {};

    // Filter by studentId if supplied
    if (studentId) {
      whereClause.exam = { studentId: Number(studentId) };
    }

    // Role-based restrictions:
    // Students can only see their own certificates
    if (user.role === 'student') {
      whereClause.exam = { studentId: user.id };
    }

    // Parents can only see their children's certificates
    if (user.role === 'parent') {
      const children = await prisma.studentParent.findMany({
        where: { parentId: user.id },
        select: { studentId: true },
      });
      const childrenIds = children.map((c) => c.studentId);
      whereClause.exam = { studentId: { in: childrenIds } };
    }

    const certificates = await prisma.certificate.findMany({
      where: whereClause,
      include: {
        exam: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                nis: true,
                avatarUrl: true,
                level: { select: { name: true } },
              },
            },
            ustadz: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

// 5. Get Coordinator Summary (Dashboard Statistics & Reports)
export const getCoordinatorSummary = async (_req: AuthRequest, res: Response) => {
  try {
    // 1. Basic Counts
    const totalHalaqahs = await prisma.halaqah.count();
    const totalMusyrifs = await prisma.user.count({ where: { role: 'ustadz' } });
    const totalStudents = await prisma.user.count({ where: { role: 'student' } });
    const totalCertificates = await prisma.certificate.count();
    const pendingExamsCount = await prisma.juziyahExam.count({ where: { status: 'pending' } });

    // 2. Halaqah lists with ustadz & student count
    const halaqahs = await prisma.halaqah.findMany({
      include: {
        ustadz: { select: { id: true, name: true, email: true } },
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                nis: true,
                level: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const halaqahsSummary = halaqahs.map((h) => ({
      id: h.id,
      name: h.name,
      ustadz: h.ustadz,
      studentCount: h.students.length,
      description: h.description,
      students: h.students.map((s) => s.student),
    }));

    // 3. Rekap Laporan: All session logs across all groups for report generation
    const rekapLaporan = await prisma.sessionLog.findMany({
      include: {
        student: { select: { id: true, name: true, email: true, nis: true } },
        ustadz: { select: { id: true, name: true, email: true } },
        halaqah: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Rekap Pencapaian: student levels and their achievements (certified juzs)
    const studentsAchievement = await prisma.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        name: true,
        nis: true,
        level: { select: { name: true } },
        examsAsStudent: {
          where: { status: 'lulus' },
          select: {
            id: true,
            juzId: true,
            score: true,
            createdAt: true,
            certificate: { select: { certificateNo: true, issuedAt: true } },
          },
        },
        sessionsAsStudent: {
          select: {
            id: true,
            sessionType: true,
            scoreFinal: true,
          },
        },
      },
    });

    const rekapPencapaian = studentsAchievement.map((student) => {
      const setoranCount = student.sessionsAsStudent.filter((s) => s.sessionType === 'setoran_baru').length;
      const murajaahCount = student.sessionsAsStudent.filter((s) => s.sessionType === 'murajaah').length;
      const averageScore = student.sessionsAsStudent.length > 0
        ? Number((student.sessionsAsStudent.reduce((sum, s) => sum + s.scoreFinal, 0) / student.sessionsAsStudent.length).toFixed(2))
        : 100;

      return {
        id: student.id,
        name: student.name,
        nis: student.nis,
        levelName: student.level?.name || 'Belum Ditentukan',
        certifiedJuzs: student.examsAsStudent.map((e) => ({
          juzId: e.juzId,
          score: e.score,
          certificateNo: e.certificate?.certificateNo,
          issuedAt: e.certificate?.issuedAt,
        })),
        stats: {
          setoranCount,
          murajaahCount,
          averageScore,
        },
      };
    });

    // 5. Exam Pass Ratio Statistics
    const totalExams = await prisma.juziyahExam.count({
      where: { status: { in: ['lulus', 'mengulang'] } },
    });
    const totalPassExams = await prisma.juziyahExam.count({
      where: { status: 'lulus' },
    });
    const examPassRatio = totalExams > 0 ? Number(((totalPassExams / totalExams) * 100).toFixed(1)) : 0;

    return res.json({
      totalHalaqahs,
      totalMusyrifs,
      totalStudents,
      totalCertificates,
      pendingExamsCount,
      examPassRatio,
      halaqahs: halaqahsSummary,
      rekapLaporan,
      rekapPencapaian,
    });
  } catch (error) {
    console.error('Error fetching coordinator summary:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};
