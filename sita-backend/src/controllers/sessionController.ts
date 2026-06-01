import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const finishSession = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    studentId,
    surahId,
    startAyah,
    endAyah,
    sessionType,
    errors: markedErrors, // [{ type: 'jali'|'khafi'|'tark', words: [{ ayahId, wordIdx, text }] }]
    notesUstadz,
    juzId,
    setoranScope,
    pageNumber,
    startPage,
    endPage,
  } = req.body;

  const isTasmi = sessionType === 'tasmi_mandiri' || sessionType === 'tasmi_teman';

  if (req.user.role !== 'ustadz' && !(req.user.role === 'student' && isTasmi)) {
    return res.status(403).json({ error: 'Hanya ustadz yang dapat menilai sesi, kecuali untuk mode Tasmi' });
  }

  try {
    if (!studentId || !surahId || !startAyah || !endAyah || !sessionType) {
      return res.status(400).json({ error: 'Data sesi tidak lengkap' });
    }

    const student = await prisma.user.findUnique({ where: { id: parseInt(studentId) } });
    if (!student || student.role !== 'student') {
      return res.status(400).json({ error: 'Santri tidak ditemukan' });
    }

    // Get student's halaqah
    const halaqahStudent = await prisma.halaqahStudent.findFirst({
      where: { studentId: student.id },
      include: { halaqah: true }
    });
    
    if (!halaqahStudent) {
      return res.status(400).json({ error: 'Santri tidak terdaftar di halaqah manapun' });
    }

    const ustadzIdToAssign = req.user.role === 'ustadz' ? req.user.id : halaqahStudent.halaqah.ustadzId;

    // Get active academic year
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true }
    });

    // Get active classroom for this student
    const activeClassStudent = await prisma.classroomStudent.findFirst({
      where: {
        studentId: student.id,
        classroom: {
          academicYear: {
            isActive: true
          }
        }
      }
    });

    // Get current scoring configuration
    const config = await prisma.scoringConfig.findFirst({
      orderBy: { id: 'desc' },
    });
    const penaltyJali = config?.penaltyJali ?? 3;
    const penaltyKhafi = config?.penaltyKhafi ?? 1;
    const penaltyTark = config?.penaltyTark ?? 2;
    const passThreshold = config?.passThreshold ?? 80;
    const scoreInitial = config?.scoreInitial ?? 100;

    // Count error categories
    let errorJaliCount = 0;
    let errorKhafiCount = 0;
    let errorTarkCount = 0;
    let penalty = 0;

    const bookmarksData: any[] = [];

    if (Array.isArray(markedErrors)) {
      markedErrors.forEach((err: any) => {
        if (err.type === 'jali') {
          errorJaliCount++;
          penalty += penaltyJali;
        } else if (err.type === 'khafi') {
          errorKhafiCount++;
          penalty += penaltyKhafi;
        } else if (err.type === 'tark') {
          errorTarkCount++;
          penalty += penaltyTark;
        }

        // Each error can span multiple words
        if (Array.isArray(err.words)) {
          err.words.forEach((w: any) => {
            bookmarksData.push({
              surahId: w.surahId || surahId,
              ayahId: w.ayahId,
              wordIndex: w.wordIdx,
              wordTextAr: w.text || '',
              errorType: err.type,
              penaltyApplied: err.type === 'jali' ? penaltyJali : err.type === 'tark' ? penaltyTark : penaltyKhafi,
              note: err.note || null,
            });
          });
        }
      });
    }

    // In Juz mode, the score is calculated per-page then averaged, so we accept pre-calculated scoreFinal and status from the frontend.
    const scoreFinal = req.body.scoreFinal !== undefined ? parseFloat(req.body.scoreFinal) : Math.max(0, scoreInitial - penalty);
    const status = req.body.status !== undefined ? req.body.status : (scoreFinal >= passThreshold ? 'lulus' : 'mengulang');

    // Create session log and error bookmarks in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.sessionLog.create({
        data: {
          studentId: student.id,
          ustadzId: ustadzIdToAssign,
          halaqahId: halaqahStudent.halaqahId,
          sessionType,
          surahId,
          startAyah: parseInt(startAyah),
          endAyah: parseInt(endAyah),
          juzId: juzId ? parseInt(juzId) : undefined,
          setoranScope,
          pageNumber: pageNumber ? parseInt(pageNumber) : undefined,
          startPage: startPage ? parseInt(startPage) : undefined,
          endPage: endPage ? parseInt(endPage) : undefined,
          totalWords: bookmarksData.length, // total wrong words
          errorJaliCount,
          errorKhafiCount,
          errorTarkCount,
          scoreInitial,
          scoreFinal,
          status,
          notesUstadz,
          scoringConfigSnapshot: JSON.stringify({
            scoreInitial,
            penaltyJali,
            penaltyKhafi,
            penaltyTark,
            passThreshold,
          }),
          academicYearId: activeYear?.id || null,
          classroomId: activeClassStudent?.classroomId || null,
          finishedAt: new Date(),
        },
      });

      // Insert error bookmarks
      if (bookmarksData.length > 0) {
        await tx.errorBookmark.createMany({
          data: bookmarksData.map((b) => ({
            ...b,
            sessionId: session.id,
          })),
        });
      }

      // Generate customized notification message
      const scopeLabel = setoranScope === 'halaman'
        ? `Halaman ${pageNumber}`
        : (setoranScope === 'seperempat_juz' || setoranScope === 'quarter_juz')
        ? '1/4 Juz'
        : (setoranScope === 'setengah_juz' || setoranScope === 'half_juz')
        ? '1/2 Juz'
        : (setoranScope === 'tiga_perempat_juz' || setoranScope === 'three_quarter_juz')
        ? '3/4 Juz'
        : setoranScope === 'tasmi_juz'
        ? 'Tasmi 1 Juz'
        : `Surah ${surahId} ayat ${startAyah}-${endAyah}`;

      const notifBodyStudent = juzId
        ? `Setoran hafalan Juz ${juzId} (${scopeLabel}) telah dinilai. Skor: ${scoreFinal} (${status.toUpperCase()}).`
        : `Setoran hafalan Surah ${surahId} ayat ${startAyah}-${endAyah} telah dinilai. Skor: ${scoreFinal} (${status.toUpperCase()}).`;

      const notifBodyParent = juzId
        ? `Anak Anda, ${student.name}, baru saja menyelesaikan setoran Juz ${juzId} (${scopeLabel}). Skor: ${scoreFinal} (${status.toUpperCase()}).`
        : `Anak Anda, ${student.name}, baru saja menyelesaikan setoran Surah ${surahId} ayat ${startAyah}-${endAyah}. Skor: ${scoreFinal} (${status.toUpperCase()}).`;

      // Create Notification for Student
      await tx.notification.create({
        data: {
          recipientId: student.id,
          type: 'session_complete',
          title: 'Sesi Talaqqi Selesai',
          body: notifBodyStudent,
          data: JSON.stringify({ sessionId: session.id }),
        },
      });

      // Get student's parents to notify
      const studentParents = await tx.studentParent.findMany({
        where: { studentId: student.id },
      });

      for (const p of studentParents) {
        await tx.notification.create({
          data: {
            recipientId: p.parentId,
            type: 'session_complete',
            title: 'Sesi Talaqqi Anak Selesai',
            body: notifBodyParent,
            data: JSON.stringify({ sessionId: session.id }),
          },
        });

        // Simulating WhatsApp message delivery to parent
        console.log(`\n========================================`);
        console.log(`[SIMULASI WHATSAPP] Mengirim pesan ke Wali (User ID: ${p.parentId}):`);
        console.log(`Pesan: "${notifBodyParent}"`);
        console.log(`========================================\n`);

        // Simulating Email message delivery to parent
        const parentUser = await tx.user.findUnique({
          where: { id: p.parentId },
          select: { email: true, name: true }
        });
        const parentEmail = parentUser?.email || `parent_${p.parentId}@example.com`;
        const parentName = parentUser?.name || 'Wali Murid';

        console.log(`\n========================================`);
        console.log(`[SIMULASI EMAIL] Mengirim rekap setoran ke Orangtua:`);
        console.log(`Ke: ${parentEmail} (${parentName})`);
        console.log(`Subjek: Laporan Sesi Setoran Ananda ${student.name}`);
        console.log(`Isi: ${notifBodyParent}`);
        console.log(`========================================\n`);
      }

      return session;
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error finishing session:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const getSessionDetail = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const session = await prisma.sessionLog.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, nis: true } },
        ustadz: { select: { id: true, name: true } },
        errors: true,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    }

    // Role access authorization check
    if (req.user!.role === 'student' && session.studentId !== req.user!.id) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }

    if (req.user!.role === 'parent') {
      const isParentOfStudent = await prisma.studentParent.findFirst({
        where: { studentId: session.studentId, parentId: req.user!.id },
      });
      if (!isParentOfStudent) {
        return res.status(403).json({ error: 'Akses ditolak' });
      }
    }

    return res.json(session);
  } catch (error) {
    console.error('Error fetching session detail:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const listSessions = async (req: AuthRequest, res: Response) => {
  const role = req.user!.role;
  const userId = req.user!.id;

  try {
    let whereClause: any = {};

    if (role === 'student') {
      whereClause.studentId = userId;
    } else if (role === 'parent') {
      const children = await prisma.studentParent.findMany({
        where: { parentId: userId },
        select: { studentId: true },
      });
      const childrenIds = children.map((c) => c.studentId);
      whereClause.studentId = { in: childrenIds };
    } else if (role === 'ustadz') {
      whereClause.ustadzId = userId;
    }

    const sessions = await prisma.sessionLog.findMany({
      where: whereClause,
      include: {
        student: { select: { id: true, name: true } },
        ustadz: { select: { id: true, name: true } },
        errors: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(sessions);
  } catch (error) {
    console.error('Error listing sessions:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};
