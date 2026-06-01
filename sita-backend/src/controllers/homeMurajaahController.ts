import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── TUGAS MURAJAAH (ASSIGNMENTS) ─────────────────────────

export const createHomeAssignment = async (req: AuthRequest, res: Response) => {
  const { studentId, halaqahId, assignedDate, shift, targetType, targetName } = req.body;
  const ustadzId = req.user!.id;

  if (!assignedDate || !shift || !targetType || !targetName) {
    return res.status(400).json({ error: 'Form data tugas tidak lengkap' });
  }

  try {
    let studentIds: number[] = [];

    // Jika ditugaskan per-halaqah
    if (halaqahId) {
      const hStudents = await prisma.halaqahStudent.findMany({
        where: { halaqahId: parseInt(halaqahId) },
        select: { studentId: true }
      });
      studentIds = hStudents.map(hs => hs.studentId);
    } else if (studentId) {
      studentIds = [parseInt(studentId)];
    }

    if (studentIds.length === 0) {
      return res.status(400).json({ error: 'Tidak ada santri penerima tugas yang valid' });
    }

    // Buat tugas untuk masing-masing siswa
    const assignmentsData = studentIds.map(sid => ({
      studentId: sid,
      ustadzId,
      assignedDate,
      shift,
      targetType,
      targetName
    }));

    await prisma.homeMurajaahAssignment.createMany({
      data: assignmentsData
    });

    return res.json({ success: true, message: `Tugas berhasil dikirim ke ${studentIds.length} santri` });
  } catch (error) {
    console.error('Error creating home assignment:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memproses penugasan' });
  }
};

export const getStudentHomeAssignments = async (req: AuthRequest, res: Response) => {
  const studentId = parseInt(req.params.studentId);
  if (isNaN(studentId)) {
    return res.status(400).json({ error: 'ID Santri tidak valid' });
  }

  try {
    const assignments = await prisma.homeMurajaahAssignment.findMany({
      where: { studentId },
      include: {
        ustadz: {
          select: { name: true }
        }
      },
      orderBy: { assignedDate: 'desc' }
    });
    return res.json(assignments);
  } catch (error) {
    console.error('Error fetching student home assignments:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat mengambil daftar tugas' });
  }
};

export const getParentHomeAssignments = async (req: AuthRequest, res: Response) => {
  const parentId = req.user!.id;

  try {
    // Cari anak-anak dari wali kelas/ortu ini
    const relations = await prisma.studentParent.findMany({
      where: { parentId },
      select: { studentId: true }
    });
    const studentIds = relations.map(r => r.studentId);

    const assignments = await prisma.homeMurajaahAssignment.findMany({
      where: {
        studentId: { in: studentIds }
      },
      include: {
        student: {
          select: { name: true, nis: true }
        },
        ustadz: {
          select: { name: true }
        }
      },
      orderBy: { assignedDate: 'desc' }
    });

    return res.json(assignments);
  } catch (error) {
    console.error('Error fetching parent home assignments:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data tugas anak' });
  }
};

export const submitHomeFeedback = async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const { isExecuted, isTargetMet, isFluent, parentSignature, parentNotes } = req.body;

  if (isExecuted === undefined || isTargetMet === undefined || isFluent === undefined || !parentSignature) {
    return res.status(400).json({ error: 'Isian form penyimakan orang tua tidak lengkap' });
  }

  try {
    const updated = await prisma.homeMurajaahAssignment.update({
      where: { id },
      data: {
        isExecuted: !!isExecuted,
        isTargetMet: !!isTargetMet,
        isFluent: !!isFluent,
        parentSignature,
        parentNotes: parentNotes || '',
        feedbackAt: new Date()
      }
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error submitting home feedback:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan feedback mutabaah' });
  }
};

export const getHomeMurajaahReport = async (req: AuthRequest, res: Response) => {
  const role = req.user!.role;
  const userId = req.user!.id;

  try {
    let whereClause: any = {};

    if (role === 'ustadz') {
      whereClause.ustadzId = userId;
    } else if (role === 'parent') {
      const relations = await prisma.studentParent.findMany({
        where: { parentId: userId },
        select: { studentId: true }
      });
      whereClause.studentId = { in: relations.map(r => r.studentId) };
    } else if (role === 'student') {
      whereClause.studentId = userId;
    }

    const report = await prisma.homeMurajaahAssignment.findMany({
      where: whereClause,
      include: {
        student: {
          select: { name: true, nis: true }
        },
        ustadz: {
          select: { name: true }
        }
      },
      orderBy: [
        { assignedDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return res.json(report);
  } catch (error) {
    console.error('Error fetching home murajaah report:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memproses laporan mutabaah' });
  }
};
