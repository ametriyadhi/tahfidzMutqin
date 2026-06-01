import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMessages = async (req: AuthRequest, res: Response) => {
  const studentId = parseInt(req.params.studentId);
  try {
    const messages = await prisma.message.findMany({
      where: { studentId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        }
      }
    });
    
    // Mark messages as read if receiver is current user
    const unreadIds = messages
      .filter(m => m.receiverId === req.user!.id && !m.isRead)
      .map(m => m.id);
      
    if (unreadIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { isRead: true }
      });
    }

    return res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat mengambil pesan' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  let { receiverId, studentId, content } = req.body;
  
  if (!studentId || !content) {
    return res.status(400).json({ error: 'Data tidak lengkap: studentId dan content wajib diisi' });
  }

  const sId = parseInt(studentId);
  const senderId = req.user!.id;
  const senderRole = req.user!.role;

  try {
    let resolvedReceiverId = receiverId ? parseInt(receiverId) : 0;

    if (!resolvedReceiverId || isNaN(resolvedReceiverId)) {
      if (senderRole === 'ustadz') {
        // Find parent of this student
        const relation = await prisma.studentParent.findFirst({
          where: { studentId: sId }
        });
        if (!relation) {
          return res.status(400).json({ error: 'Orang tua/Wali tidak ditemukan untuk santri ini' });
        }
        resolvedReceiverId = relation.parentId;
      } else if (senderRole === 'parent') {
        // Find halaqah ustadz of this student
        const halaqahStudent = await prisma.halaqahStudent.findFirst({
          where: { studentId: sId },
          include: { halaqah: true }
        });
        if (!halaqahStudent || !halaqahStudent.halaqah) {
          return res.status(400).json({ error: 'Ustadz halaqah tidak ditemukan untuk santri ini' });
        }
        resolvedReceiverId = halaqahStudent.halaqah.ustadzId;
      } else {
        return res.status(403).json({ error: 'Peran Anda tidak diizinkan mengirim pesan di buku penghubung' });
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId: resolvedReceiverId,
        studentId: sId,
        content,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        }
      }
    });
    
    return res.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat mengirim pesan' });
  }
};
