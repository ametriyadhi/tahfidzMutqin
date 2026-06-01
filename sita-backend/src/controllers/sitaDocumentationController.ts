import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listDocumentation = async (_req: AuthRequest, res: Response) => {
  try {
    const documentationList = await prisma.sitaDocumentation.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(documentationList);
  } catch (error) {
    console.error('Error fetching documentation:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memuat data dokumentasi' });
  }
};

export const createDocumentation = async (req: AuthRequest, res: Response) => {
  const { title, imageUrl, tag } = req.body;

  if (!title || !imageUrl) {
    return res.status(400).json({ error: 'Judul dan Foto wajib diisi' });
  }

  try {
    const record = await prisma.sitaDocumentation.create({
      data: {
        title,
        imageUrl,
        tag: tag || 'Kegiatan'
      }
    });
    return res.json({ success: true, data: record });
  } catch (error) {
    console.error('Error creating documentation:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan foto dokumentasi' });
  }
};

export const deleteDocumentation = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID tidak valid' });
  }

  try {
    await prisma.sitaDocumentation.delete({
      where: { id }
    });
    return res.json({ success: true, message: 'Foto dokumentasi berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting documentation:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat menghapus foto dokumentasi' });
  }
};
