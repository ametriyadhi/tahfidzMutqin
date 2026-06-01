import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Configuration handlers
export const getConfig = async (_req: AuthRequest, res: Response) => {
  try {
    const config = await prisma.scoringConfig.findFirst({
      orderBy: { id: 'desc' },
    });
    return res.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const updateConfig = async (req: AuthRequest, res: Response) => {
  const { scoreInitial, penaltyJali, penaltyKhafi, penaltyTark, passThreshold } = req.body;

  try {
    const newConfig = await prisma.scoringConfig.create({
      data: {
        scoreInitial: parseInt(scoreInitial),
        penaltyJali: parseInt(penaltyJali),
        penaltyKhafi: parseInt(penaltyKhafi),
        penaltyTark: parseInt(penaltyTark),
        passThreshold: parseInt(passThreshold),
        updatedBy: req.user!.id,
      },
    });
    return res.json(newConfig);
  } catch (error) {
    console.error('Error updating config:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const getWhiteLabel = async (_req: any, res: Response) => {
  try {
    let config = await prisma.whiteLabelConfig.findFirst({
      where: { id: 1 },
    });
    if (!config) {
      config = await prisma.whiteLabelConfig.create({
        data: {
          id: 1,
          appName: "SITA Tahfidz",
          footerText: "Sistem Digital Setoran Tahfidz",
        },
      });
    }
    return res.json(config);
  } catch (error) {
    console.error('Error fetching white label config:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const updateWhiteLabel = async (req: AuthRequest, res: Response) => {
  const { appName, footerText, appLogo, loginLogo } = req.body;

  try {
    const config = await prisma.whiteLabelConfig.upsert({
      where: { id: 1 },
      update: {
        appName,
        footerText,
        appLogo,
        loginLogo,
      },
      create: {
        id: 1,
        appName: appName || "SITA Tahfidz",
        footerText: footerText || "Sistem Digital Setoran Tahfidz",
        appLogo,
        loginLogo,
      },
    });
    return res.json(config);
  } catch (error) {
    console.error('Error updating white label config:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};


// Users management handlers
export const getUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: 'asc' },
      include: {
        customFieldValues: {
          select: {
            fieldId: true,
            value: true,
            field: {
              select: {
                fieldName: true,
                fieldType: true,
                role: true
              }
            }
          }
        }
      }
    });
    return res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  const { name, email, password, role, nis, customFields } = req.body;

  try {
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        nis,
      },
    });

    // Save custom field values if provided
    if (customFields && typeof customFields === 'object') {
      const valueData = Object.entries(customFields).map(([fieldId, value]) => ({
        userId: newUser.id,
        fieldId: parseInt(fieldId),
        value: String(value),
      }));

      if (valueData.length > 0) {
        await prisma.customFieldValue.createMany({
          data: valueData,
        });
      }
    }

    return res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      nis: newUser.nis,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, password, role, nis, isActive, customFields } = req.body;

  try {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID user tidak valid' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    if (email && email !== existingUser.email) {
      const emailDup = await prisma.user.findUnique({ where: { email } });
      if (emailDup) {
        return res.status(400).json({ error: 'Email sudah terdaftar' });
      }
    }

    const updateData: any = {
      name: name || undefined,
      email: email || undefined,
      role: role || undefined,
      nis: nis !== undefined ? nis : undefined,
      isActive: isActive !== undefined ? (isActive === true) : undefined,
    };

    if (password) {
      updateData.passwordHash = bcrypt.hashSync(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Save/Update custom field values if provided
    if (customFields && typeof customFields === 'object') {
      for (const [fieldId, value] of Object.entries(customFields)) {
        const fId = parseInt(fieldId);
        await prisma.customFieldValue.upsert({
          where: {
            userId_fieldId: {
              userId: userId,
              fieldId: fId
            }
          },
          update: {
            value: String(value)
          },
          create: {
            userId: userId,
            fieldId: fId,
            value: String(value)
          }
        });
      }
    }

    return res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      nis: updatedUser.nis,
      isActive: updatedUser.isActive,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID user tidak valid' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    // Clean up relations manually for SQLite to avoid foreign key violations
    
    // Find halaqahs owned by this user (if ustadz)
    const halaqahs = await prisma.halaqah.findMany({
      where: { ustadzId: userId },
      select: { id: true },
    });
    const halaqahIds = halaqahs.map(h => h.id);

    // 1. Delete session logs (along with their cascade error bookmarks)
    await prisma.sessionLog.deleteMany({
      where: {
        OR: [
          { studentId: userId },
          { ustadzId: userId },
          { halaqahId: { in: halaqahIds } }
        ]
      }
    });

    // 2. Delete Halaqahs where user is Ustadz
    await prisma.halaqah.deleteMany({
      where: { ustadzId: userId }
    });

    // 3. Delete StudentParent links
    await prisma.studentParent.deleteMany({
      where: {
        OR: [
          { studentId: userId },
          { parentId: userId }
        ]
      }
    });

    // 4. Delete HalaqahStudent links
    await prisma.halaqahStudent.deleteMany({
      where: {
        OR: [
          { studentId: userId }
        ]
      }
    });

    // 5. Delete ClassroomStudent links
    await prisma.classroomStudent.deleteMany({
      where: {
        OR: [
          { studentId: userId }
        ]
      }
    });

    // 6. Delete SubClassroomStudent links
    await prisma.subClassroomStudent.deleteMany({
      where: {
        OR: [
          { studentId: userId }
        ]
      }
    });

    // 7. Delete Custom Field Values
    await prisma.customFieldValue.deleteMany({
      where: { userId }
    });

    // 8. Delete Notifications
    await prisma.notification.deleteMany({
      where: { recipientId: userId }
    });

    // 9. Delete HomeMurajaahAssignment
    await prisma.homeMurajaahAssignment.deleteMany({
      where: {
        OR: [
          { studentId: userId },
          { ustadzId: userId }
        ]
      }
    });

    // 10. Delete Messages
    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
          { studentId: userId }
        ]
      }
    });

    // 11. Delete Juziyah Exams (certificates are deleted cascade)
    await prisma.juziyahExam.deleteMany({
      where: {
        OR: [
          { studentId: userId },
          { ustadzId: userId }
        ]
      }
    });

    // 12. Delete actual User
    await prisma.user.delete({
      where: { id: userId },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID user tidak valid' });
    }

    if (!password || password.trim().length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return res.json({ success: true, message: 'Password berhasil di-reset' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

// Halaqahs management
export const getHalaqahs = async (_req: AuthRequest, res: Response) => {
  try {
    const halaqahs = await prisma.halaqah.findMany({
      include: {
        ustadz: { select: { id: true, name: true } },
        students: {
          include: {
            student: { select: { id: true, name: true, nis: true } }
          }
        }
      },
      orderBy: { id: 'asc' },
    });
    return res.json(halaqahs);
  } catch (error) {
    console.error('Error fetching halaqahs:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const createHalaqah = async (req: AuthRequest, res: Response) => {
  const { name, ustadzId, description } = req.body;

  try {
    if (!name || !ustadzId) {
      return res.status(400).json({ error: 'Nama halaqah dan ustadz wajib diisi' });
    }

    const ustadz = await prisma.user.findUnique({
      where: { id: parseInt(ustadzId) },
    });

    if (!ustadz || ustadz.role !== 'ustadz') {
      return res.status(400).json({ error: 'Ustadz tidak ditemukan' });
    }

    const newHalaqah = await prisma.halaqah.create({
      data: {
        name,
        ustadzId: ustadz.id,
        description,
      },
      include: {
        ustadz: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json(newHalaqah);
  } catch (error) {
    console.error('Error creating halaqah:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const assignStudentToHalaqah = async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // halaqah id
  const { studentId } = req.body;

  try {
    if (!id || !studentId) {
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    const halaqahId = parseInt(id);
    const sId = parseInt(studentId);

    const student = await prisma.user.findUnique({ where: { id: sId } });
    if (!student || student.role !== 'student') {
      return res.status(400).json({ error: 'Santri tidak ditemukan' });
    }

    const existing = await prisma.halaqahStudent.findFirst({
      where: { halaqahId, studentId: sId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Santri sudah terdaftar di halaqah ini' });
    }

    const assigned = await prisma.halaqahStudent.create({
      data: {
        halaqahId,
        studentId: sId
      },
      include: {
        student: { select: { id: true, name: true, nis: true } }
      }
    });

    return res.status(201).json(assigned);
  } catch (error) {
    console.error('Error assigning student:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const removeStudentFromHalaqah = async (req: AuthRequest, res: Response) => {
  const { id, studentId } = req.params;

  try {
    if (!id || !studentId) {
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    const halaqahId = parseInt(id);
    const sId = parseInt(studentId);

    const match = await prisma.halaqahStudent.findFirst({
      where: { halaqahId, studentId: sId }
    });

    if (!match) {
      return res.status(400).json({ error: 'Santri tidak terdaftar di halaqah ini' });
    }

    await prisma.halaqahStudent.delete({
      where: { id: match.id }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error removing student:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const linkParentStudent = async (req: AuthRequest, res: Response) => {
  const { studentId, parentId, relationship } = req.body;

  try {
    if (!studentId || !parentId || !relationship) {
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    const sId = parseInt(studentId);
    const pId = parseInt(parentId);

    const student = await prisma.user.findUnique({ where: { id: sId } });
    const parent = await prisma.user.findUnique({ where: { id: pId } });

    if (!student || student.role !== 'student') {
      return res.status(400).json({ error: 'Santri tidak ditemukan' });
    }
    if (!parent || parent.role !== 'parent') {
      return res.status(400).json({ error: 'Orang tua tidak ditemukan' });
    }

    const existing = await prisma.studentParent.findFirst({
      where: { studentId: sId, parentId: pId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Relasi sudah terdaftar' });
    }

    const linked = await prisma.studentParent.create({
      data: {
        studentId: sId,
        parentId: pId,
        relationship
      }
    });

    return res.status(201).json(linked);
  } catch (error) {
    console.error('Error linking parent:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const getLinkedParents = async (_req: AuthRequest, res: Response) => {
  try {
    const links = await prisma.studentParent.findMany({
      include: {
        student: { select: { id: true, name: true, nis: true } },
        parent: { select: { id: true, name: true, email: true } },
      }
    });
    return res.json(links);
  } catch (error) {
    console.error('Error fetching links:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const createUsersBulk = async (req: AuthRequest, res: Response) => {
  const { users } = req.body;

  try {
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Data user tidak valid atau kosong' });
    }

    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
    const createdUsers: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      if (!u.name || !u.email || !u.role) {
        errors.push(`Baris ${i + 1}: Nama, Email, dan Role wajib diisi.`);
        continue;
      }

      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (existing) {
        errors.push(`Baris ${i + 1} (${u.email}): Email sudah terdaftar.`);
        continue;
      }

      const newUser = await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          passwordHash: defaultPasswordHash,
          role: u.role,
          nis: u.role === 'student' ? u.nis?.toString() : undefined,
        }
      });
      createdUsers.push(newUser);
    }

    return res.status(201).json({
      successCount: createdUsers.length,
      errors,
      createdUsers: createdUsers.map(cu => ({ id: cu.id, name: cu.name, email: cu.email, role: cu.role }))
    });
  } catch (error) {
    console.error('Error in bulk creation:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const getInstitutionSummary = async (_req: AuthRequest, res: Response) => {
  try {
    const studentCount = await prisma.user.count({ where: { role: 'student', isActive: true } });
    const ustadzCount = await prisma.user.count({ where: { role: 'ustadz', isActive: true } });
    const parentCount = await prisma.user.count({ where: { role: 'parent', isActive: true } });
    const adminCount = await prisma.user.count({ where: { role: 'admin', isActive: true } });

    const halaqahCount = await prisma.halaqah.count({ where: { isActive: true } });
    const totalSessions = await prisma.sessionLog.count();

    const scoreStats = await prisma.sessionLog.aggregate({
      _avg: {
        scoreFinal: true
      }
    });

    const passedSessions = await prisma.sessionLog.count({ where: { status: 'lulus' } });
    const passRate = totalSessions > 0 ? Math.round((passedSessions / totalSessions) * 100) : 0;

    return res.json({
      studentCount,
      ustadzCount,
      parentCount,
      adminCount,
      halaqahCount,
      totalSessions,
      averageScore: scoreStats._avg.scoreFinal ? Math.round(scoreStats._avg.scoreFinal * 10) / 10 : 0,
      passRate
    });
  } catch (error) {
    console.error('Error fetching institutional summary:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

// Memorization levels handlers
export const getLevels = async (_req: AuthRequest, res: Response) => {
  try {
    const levels = await prisma.hafalanLevel.findMany({
      include: {
        students: { select: { id: true, name: true, nis: true } }
      },
      orderBy: { id: 'asc' }
    });
    return res.json(levels);
  } catch (error) {
    console.error('Error fetching levels:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const createLevel = async (req: AuthRequest, res: Response) => {
  const { name, juzCount, juzList, targetDays } = req.body;
  try {
    if (!name || !juzList) {
      return res.status(400).json({ error: 'Nama level dan daftar Juz wajib diisi' });
    }
    const newLevel = await prisma.hafalanLevel.create({
      data: {
        name,
        juzCount: parseInt(juzCount) || 1,
        juzList,
        targetDays: parseInt(targetDays) || 30
      }
    });
    return res.status(201).json(newLevel);
  } catch (error) {
    console.error('Error creating level:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const updateLevel = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, juzCount, juzList, targetDays } = req.body;
  try {
    const updated = await prisma.hafalanLevel.update({
      where: { id: parseInt(id) },
      data: {
        name,
        juzCount: parseInt(juzCount),
        juzList,
        targetDays: parseInt(targetDays)
      }
    });
    return res.json(updated);
  } catch (error) {
    console.error('Error updating level:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const deleteLevel = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.user.updateMany({
      where: { levelId: parseInt(id) },
      data: { levelId: null }
    });

    await prisma.hafalanLevel.delete({
      where: { id: parseInt(id) }
    });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting level:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const assignStudentLevel = async (req: AuthRequest, res: Response) => {
  const { studentId, levelId } = req.body;
  try {
    if (!studentId) {
      return res.status(400).json({ error: 'ID Santri wajib diisi' });
    }
    const updated = await prisma.user.update({
      where: { id: parseInt(studentId) },
      data: {
        levelId: levelId ? parseInt(levelId) : null
      },
      select: {
        id: true,
        name: true,
        levelId: true
      }
    });
    return res.json(updated);
  } catch (error) {
    console.error('Error assigning level:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};
