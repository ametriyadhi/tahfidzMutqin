import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── ACADEMIC YEARS (TAHUN PELAJARAN) ───────────────────

export const getAcademicYears = async (_req: AuthRequest, res: Response) => {
  try {
    const years = await prisma.academicYear.findMany({
      orderBy: { name: 'desc' }
    });
    return res.json(years);
  } catch (error) {
    console.error('Error fetching academic years:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data tahun pelajaran' });
  }
};

export const createAcademicYear = async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nama tahun pelajaran wajib diisi' });
  }

  try {
    // Check if duplicate name exists
    const existing = await prisma.academicYear.findUnique({
      where: { name }
    });
    if (existing) {
      return res.status(400).json({ error: 'Tahun pelajaran dengan nama tersebut sudah terdaftar' });
    }

    const year = await prisma.academicYear.create({
      data: {
        name,
        isActive: false
      }
    });
    return res.json(year);
  } catch (error) {
    console.error('Error creating academic year:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat membuat tahun pelajaran' });
  }
};

export const setActiveAcademicYear = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID tidak valid' });
  }

  try {
    // Wrap in transaction: set all to inactive, then set targeted one to active
    await prisma.$transaction([
      prisma.academicYear.updateMany({
        data: { isActive: false }
      }),
      prisma.academicYear.update({
        where: { id },
        data: { isActive: true }
      })
    ]);

    return res.json({ success: true, message: 'Tahun pelajaran aktif berhasil diselaraskan' });
  } catch (error) {
    console.error('Error setting active academic year:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui status tahun pelajaran' });
  }
};

export const deleteAcademicYear = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID tidak valid' });
  }

  try {
    await prisma.academicYear.delete({
      where: { id }
    });
    return res.json({ success: true, message: 'Tahun pelajaran berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting academic year:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat menghapus tahun pelajaran' });
  }
};


// ─── CLASSROOMS (KELAS) ───────────────────────────

export const getClassrooms = async (req: AuthRequest, res: Response) => {
  const academicYearIdStr = req.query.academicYearId as string;
  const where: any = {};
  if (academicYearIdStr) {
    const ayId = parseInt(academicYearIdStr);
    if (!isNaN(ayId)) {
      where.academicYearId = ayId;
    }
  }

  try {
    const classrooms = await prisma.classroom.findMany({
      where,
      include: {
        academicYear: {
          select: { id: true, name: true, isActive: true }
        },
        _count: {
          select: { students: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return res.json(classrooms);
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data kelas' });
  }
};

export const createClassroom = async (req: AuthRequest, res: Response) => {
  const { name, academicYearId } = req.body;
  if (!name || !academicYearId) {
    return res.status(400).json({ error: 'Nama kelas dan tahun pelajaran wajib diisi' });
  }

  const ayId = parseInt(academicYearId);
  if (isNaN(ayId)) {
    return res.status(400).json({ error: 'ID tahun pelajaran tidak valid' });
  }

  try {
    const classroom = await prisma.classroom.create({
      data: {
        name,
        academicYearId: ayId
      },
      include: {
        academicYear: true
      }
    });
    return res.json(classroom);
  } catch (error) {
    console.error('Error creating classroom:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat membuat kelas' });
  }
};

export const deleteClassroom = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID tidak valid' });
  }

  try {
    await prisma.classroom.delete({
      where: { id }
    });
    return res.json({ success: true, message: 'Kelas berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting classroom:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat menghapus kelas' });
  }
};

export const getClassroomStudents = async (req: AuthRequest, res: Response) => {
  const classroomId = parseInt(req.params.id);
  if (isNaN(classroomId)) {
    return res.status(400).json({ error: 'ID tidak valid' });
  }

  try {
    const enrollments = await prisma.classroomStudent.findMany({
      where: { classroomId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            nis: true,
            levelId: true,
            level: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { student: { name: 'asc' } }
    });

    const students = enrollments.map(e => e.student);
    return res.json(students);
  } catch (error) {
    console.error('Error fetching classroom students:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat mengambil daftar siswa kelas' });
  }
};

export const assignStudentsToClassroom = async (req: AuthRequest, res: Response) => {
  const classroomId = parseInt(req.params.id);
  const { studentIds } = req.body; // Array of student user IDs

  if (isNaN(classroomId)) {
    return res.status(400).json({ error: 'ID kelas tidak valid' });
  }
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: 'Data studentIds wajib berupa array dan tidak boleh kosong' });
  }

  try {
    const sIds: number[] = studentIds.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));
    
    // Filter out students already in this classroom to prevent duplicate key error
    const existing = await prisma.classroomStudent.findMany({
      where: {
        classroomId,
        studentId: { in: sIds }
      },
      select: { studentId: true }
    });
    const existingIds = new Set(existing.map(e => e.studentId));
    const toInsert = sIds.filter(id => !existingIds.has(id));

    if (toInsert.length > 0) {
      await prisma.classroomStudent.createMany({
        data: toInsert.map(studentId => ({
          classroomId,
          studentId
        }))
      });
    }

    return res.json({
      success: true,
      message: `${toInsert.length} siswa berhasil dimasukkan ke kelas`,
      ignoredCount: existingIds.size
    });
  } catch (error) {
    console.error('Error assigning students to classroom:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memasukkan siswa ke kelas' });
  }
};

export const removeStudentFromClassroom = async (req: AuthRequest, res: Response) => {
  const classroomId = parseInt(req.params.id);
  const studentId = parseInt(req.params.studentId);

  if (isNaN(classroomId) || isNaN(studentId)) {
    return res.status(400).json({ error: 'ID tidak valid' });
  }

  try {
    await prisma.classroomStudent.deleteMany({
      where: {
        classroomId,
        studentId
      }
    });
    return res.json({ success: true, message: 'Siswa berhasil dikeluarkan dari kelas' });
  } catch (error) {
    console.error('Error removing student from classroom:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat mengeluarkan siswa dari kelas' });
  }
};

// ─── SUB CLASSROOMS (SUB KELAS) ─────────────────────────

export const getSubClassrooms = async (req: AuthRequest, res: Response) => {
  const classroomId = parseInt(req.params.classroomId);
  if (isNaN(classroomId)) {
    return res.status(400).json({ error: 'ID Kelas tidak valid' });
  }

  try {
    const subClassrooms = await prisma.subClassroom.findMany({
      where: { classroomId },
      include: {
        _count: {
          select: { students: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return res.json(subClassrooms);
  } catch (error) {
    console.error('Error fetching sub-classrooms:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data sub-kelas' });
  }
};

export const createSubClassroom = async (req: AuthRequest, res: Response) => {
  const classroomId = parseInt(req.params.classroomId);
  const { name } = req.body;

  if (isNaN(classroomId) || !name) {
    return res.status(400).json({ error: 'Data nama dan ID kelas wajib diisi' });
  }

  try {
    // Check duplicate
    const existing = await prisma.subClassroom.findFirst({
      where: {
        classroomId,
        name: { equals: name }
      }
    });
    if (existing) {
      return res.status(400).json({ error: 'Sub-kelas dengan nama tersebut sudah ada di kelas ini' });
    }

    const subClassroom = await prisma.subClassroom.create({
      data: {
        name,
        classroomId
      }
    });
    return res.json(subClassroom);
  } catch (error) {
    console.error('Error creating sub-classroom:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat membuat sub-kelas' });
  }
};

export const deleteSubClassroom = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID Sub-kelas tidak valid' });
  }

  try {
    await prisma.subClassroom.delete({
      where: { id }
    });
    return res.json({ success: true, message: 'Sub-kelas berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting sub-classroom:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat menghapus sub-kelas' });
  }
};

export const getSubClassroomStudents = async (req: AuthRequest, res: Response) => {
  const subClassroomId = parseInt(req.params.id);
  if (isNaN(subClassroomId)) {
    return res.status(400).json({ error: 'ID Sub-kelas tidak valid' });
  }

  try {
    const list = await prisma.subClassroomStudent.findMany({
      where: { subClassroomId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nis: true
          }
        }
      },
      orderBy: { student: { name: 'asc' } }
    });
    return res.json(list.map(item => item.student));
  } catch (error) {
    console.error('Error fetching sub-classroom students:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat mengambil daftar anggota sub-kelas' });
  }
};

export const assignStudentsToSubClassroom = async (req: AuthRequest, res: Response) => {
  const subClassroomId = parseInt(req.params.id);
  const { studentIds } = req.body; // Array of student user IDs

  if (isNaN(subClassroomId) || !Array.isArray(studentIds)) {
    return res.status(400).json({ error: 'Data tidak valid' });
  }

  try {
    const data = studentIds.map(studentId => ({
      subClassroomId,
      studentId
    }));

    await prisma.subClassroomStudent.createMany({
      data,
      skipDuplicates: true
    });

    return res.json({ success: true, message: 'Siswa berhasil ditambahkan ke sub-kelas' });
  } catch (error) {
    console.error('Error assigning students to sub-classroom:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memasukkan siswa ke sub-kelas' });
  }
};

export const removeStudentFromSubClassroom = async (req: AuthRequest, res: Response) => {
  const subClassroomId = parseInt(req.params.id);
  const studentId = parseInt(req.params.studentId);

  if (isNaN(subClassroomId) || isNaN(studentId)) {
    return res.status(400).json({ error: 'ID tidak valid' });
  }

  try {
    await prisma.subClassroomStudent.deleteMany({
      where: {
        subClassroomId,
        studentId
      }
    });
    return res.json({ success: true, message: 'Siswa berhasil dikeluarkan dari sub-kelas' });
  } catch (error) {
    console.error('Error removing student from sub-classroom:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat mengeluarkan siswa dari sub-kelas' });
  }
};
