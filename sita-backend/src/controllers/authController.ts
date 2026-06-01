import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'sita_super_secret_jwt_key_2026';

export const login = async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password harus diisi' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    // Generate Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userWithLevel = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        level: {
          select: {
            id: true,
            name: true,
            juzCount: true,
            juzList: true,
            targetDays: true
          }
        }
      }
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        nis: user.nis,
        avatarUrl: user.avatarUrl,
        levelId: userWithLevel?.levelId,
        level: userWithLevel?.level,
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Tidak terautentikasi' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        nis: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        levelId: true,
        level: {
          select: {
            id: true,
            name: true,
            juzCount: true,
            juzList: true,
            targetDays: true
          }
        }
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Tidak terautentikasi' });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Password lama dan baru harus diisi' });
    }

    if (newPassword.trim().length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Password lama tidak sesuai' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(newPassword, salt);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    return res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};
