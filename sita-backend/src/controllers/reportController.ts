import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getHeatmap = async (req: AuthRequest, res: Response) => {
  const studentId = parseInt(req.params.studentId);
  const surahId = req.query.surah_id ? parseInt(req.query.surah_id as string) : undefined;

  // Access validation: Student can only see their own heatmap, parents can only see their kids'
  if (req.user!.role === 'student' && req.user!.id !== studentId) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }

  if (req.user!.role === 'parent') {
    const isParent = await prisma.studentParent.findFirst({
      where: { studentId, parentId: req.user!.id },
    });
    if (!isParent) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
  }

  try {
    const errors = await prisma.errorBookmark.findMany({
      where: {
        session: { studentId },
        ...(surahId ? { surahId } : {}),
      },
      select: {
        surahId: true,
        ayahId: true,
        wordIndex: true,
        errorType: true,
      },
    });

    const heatmap: Record<string, {
      surahId: number;
      ayahId: number;
      wordIndex: number;
      count: number;
      jaliCount: number;
      khafiCount: number;
      tarkCount: number;
    }> = {};

    errors.forEach((err) => {
      const key = `${err.surahId}-${err.ayahId}-${err.wordIndex}`;
      if (!heatmap[key]) {
        heatmap[key] = {
          surahId: err.surahId,
          ayahId: err.ayahId,
          wordIndex: err.wordIndex,
          count: 0,
          jaliCount: 0,
          khafiCount: 0,
          tarkCount: 0,
        };
      }
      heatmap[key].count++;
      if (err.errorType === 'jali') heatmap[key].jaliCount++;
      else if (err.errorType === 'khafi') heatmap[key].khafiCount++;
      else if (err.errorType === 'tark') heatmap[key].tarkCount++;
    });

    return res.json(Object.values(heatmap));
  } catch (error) {
    console.error('Error fetching heatmap:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const getProgress = async (req: AuthRequest, res: Response) => {
  const studentId = parseInt(req.params.studentId);

  // Authorization check
  if (req.user!.role === 'student' && req.user!.id !== studentId) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }

  if (req.user!.role === 'parent') {
    const isParent = await prisma.studentParent.findFirst({
      where: { studentId, parentId: req.user!.id },
    });
    if (!isParent) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
  }

  try {
    const logs = await prisma.sessionLog.findMany({
      where: { studentId },
      orderBy: { createdAt: 'asc' },
    });

    const scoreHistory = logs.map((l) => ({
      id: l.id,
      date: l.createdAt,
      score: l.scoreFinal,
      status: l.status,
      surah: l.surahId,
      range: `${l.startAyah}-${l.endAyah}`,
      juzId: l.juzId,
      setoranScope: l.setoranScope,
      pageNumber: l.pageNumber,
    }));

    // Calculate error category totals
    let totalJali = 0;
    let totalKhafi = 0;
    let totalTark = 0;
    let totalSessions = logs.length;
    let passedSessions = 0;

    logs.forEach((l) => {
      totalJali += l.errorJaliCount;
      totalKhafi += l.errorKhafiCount;
      totalTark += l.errorTarkCount;
      if (l.status === 'lulus') passedSessions++;
    });

    // Calculate streak (consecutive days of sessions)
    let currentStreak = 0;
    if (logs.length > 0) {
      const dates = logs.map((l) => new Date(l.createdAt).toDateString());
      const uniqueDates = Array.from(new Set(dates)).map((d) => new Date(d));
      uniqueDates.sort((a, b) => b.getTime() - a.getTime()); // desc

      let today = new Date();
      today.setHours(0, 0, 0, 0);

      let expectedDate = today;
      let dateIdx = 0;

      // Check if last session was today or yesterday to start streak
      const lastSessionDate = uniqueDates[0];
      if (lastSessionDate) {
        lastSessionDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) {
          expectedDate = lastSessionDate;
          currentStreak = 1;
          dateIdx = 1;

          while (dateIdx < uniqueDates.length) {
            const nextDate = uniqueDates[dateIdx];
            nextDate.setHours(0, 0, 0, 0);
            const expectedPrev = new Date(expectedDate);
            expectedPrev.setDate(expectedPrev.getDate() - 1);

            if (nextDate.getTime() === expectedPrev.getTime()) {
              currentStreak++;
              expectedDate = nextDate;
              dateIdx++;
            } else {
              break;
            }
          }
        }
      }
    }

    return res.json({
      totalSessions,
      passedSessions,
      failedSessions: totalSessions - passedSessions,
      currentStreak,
      scoreHistory,
      errorDistribution: {
        jali: totalJali,
        khafi: totalKhafi,
        tark: totalTark,
      },
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};
