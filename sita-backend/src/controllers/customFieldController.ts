import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get custom fields for a specific role
export const getCustomFieldsByRole = async (req: AuthRequest, res: Response) => {
  const { role } = req.params;

  try {
    if (!['ustadz', 'student', 'parent'].includes(role)) {
      return res.status(400).json({ error: 'Peran tidak valid' });
    }

    const fields = await prisma.customField.findMany({
      where: { role },
      orderBy: { id: 'asc' },
    });

    return res.json(fields);
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

// Create a new custom field definition
export const createCustomField = async (req: AuthRequest, res: Response) => {
  const { role, fieldName, fieldType, options, isRequired } = req.body;

  try {
    if (!role || !fieldName || !fieldType) {
      return res.status(400).json({ error: 'Nama field, tipe data, dan peran wajib diisi' });
    }

    if (!['ustadz', 'student', 'parent'].includes(role)) {
      return res.status(400).json({ error: 'Peran tidak valid' });
    }

    if (!['text', 'number', 'date', 'select'].includes(fieldType)) {
      return res.status(400).json({ error: 'Tipe data tidak valid' });
    }

    const newField = await prisma.customField.create({
      data: {
        role,
        fieldName,
        fieldType,
        options: options || null,
        isRequired: isRequired === true,
      },
    });

    return res.status(201).json(newField);
  } catch (error) {
    console.error('Error creating custom field:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

// Update an existing custom field definition
export const updateCustomField = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { fieldName, fieldType, options, isRequired } = req.body;

  try {
    const fieldId = parseInt(id);
    if (isNaN(fieldId)) {
      return res.status(400).json({ error: 'ID field tidak valid' });
    }

    const existingField = await prisma.customField.findUnique({
      where: { id: fieldId },
    });

    if (!existingField) {
      return res.status(444).json({ error: 'Field kustom tidak ditemukan' });
    }

    if (fieldType && !['text', 'number', 'date', 'select'].includes(fieldType)) {
      return res.status(400).json({ error: 'Tipe data tidak valid' });
    }

    const updatedField = await prisma.customField.update({
      where: { id: fieldId },
      data: {
        fieldName: fieldName || undefined,
        fieldType: fieldType || undefined,
        options: options !== undefined ? options : undefined,
        isRequired: isRequired !== undefined ? (isRequired === true) : undefined,
      },
    });

    return res.json(updatedField);
  } catch (error) {
    console.error('Error updating custom field:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

// Delete a custom field definition (cascades to field values)
export const deleteCustomField = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const fieldId = parseInt(id);
    if (isNaN(fieldId)) {
      return res.status(400).json({ error: 'ID field tidak valid' });
    }

    const existingField = await prisma.customField.findUnique({
      where: { id: fieldId },
    });

    if (!existingField) {
      return res.status(404).json({ error: 'Field kustom tidak ditemukan' });
    }

    // Delete values first (optional, cascade takes care of it, but good for explicit safety)
    await prisma.customFieldValue.deleteMany({
      where: { fieldId },
    });

    await prisma.customField.delete({
      where: { id: fieldId },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom field:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};
