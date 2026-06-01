import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getSurahs = async (_req: AuthRequest, res: Response) => {
  try {
    const surahs = await prisma.surah.findMany({
      orderBy: { id: 'asc' },
    });
    return res.json(surahs);
  } catch (error) {
    console.error('Error fetching surahs:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const getAyahs = async (req: AuthRequest, res: Response) => {
  const surahId = parseInt(req.params.surahId);
  const start = parseInt(req.query.from as string || '1');
  const end = parseInt(req.query.to as string || '10');

  try {
    const surah = await prisma.surah.findUnique({
      where: { id: surahId },
    });

    if (!surah) {
      return res.status(404).json({ error: 'Surah tidak ditemukan' });
    }

    const ayahs = await prisma.ayah.findMany({
      where: {
        surahId,
        ayahId: { gte: start, lte: end },
      },
      orderBy: { ayahId: 'asc' },
    });

    const formattedAyahs = ayahs.map((a) => {
      const wordsList = a.text.split(' ');
      return {
        id: a.id,
        ayah_id: a.ayahId,
        surahId: a.surahId,
        text: a.text,
        words: wordsList.map((w, idx) => ({
          id: idx,
          text: w,
        })),
      };
    });

    return res.json({
      surah_id: surah.id,
      surah_name_ar: surah.nameAr,
      surah_name_id: surah.nameEn,
      ayahs: formattedAyahs,
    });
  } catch (error) {
    console.error('Error fetching ayahs:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};
