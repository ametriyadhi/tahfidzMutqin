import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, authorizeRoles, AuthRequest } from './middleware/auth';
import { login, getProfile } from './controllers/authController';
import { getSurahs, getAyahs } from './controllers/quranController';
import { finishSession, getSessionDetail, listSessions } from './controllers/sessionController';
import { getHeatmap, getProgress } from './controllers/reportController';
import { getMessages, sendMessage } from './controllers/messagesController';
import { getConfig, updateConfig, getUsers, createUser, updateUser, deleteUser, getHalaqahs, createHalaqah, assignStudentToHalaqah, removeStudentFromHalaqah, linkParentStudent, getLinkedParents, createUsersBulk, getInstitutionSummary, getWhiteLabel, updateWhiteLabel, getLevels, createLevel, updateLevel, deleteLevel, assignStudentLevel } from './controllers/adminController';
import { requestJuziyahExam, getPendingJuziyahExams, submitJuziyahExamResult, getCertificates, getCoordinatorSummary } from './controllers/juziyahController';
import { getCustomFieldsByRole, createCustomField, updateCustomField, deleteCustomField } from './controllers/customFieldController';
import {
  getAcademicYears,
  createAcademicYear,
  setActiveAcademicYear,
  deleteAcademicYear,
  getClassrooms,
  createClassroom,
  deleteClassroom,
  getClassroomStudents,
  assignStudentsToClassroom,
  removeStudentFromClassroom,
  getSubClassrooms,
  createSubClassroom,
  deleteSubClassroom,
  getSubClassroomStudents,
  assignStudentsToSubClassroom,
  removeStudentFromSubClassroom
} from './controllers/academicController';
import {
  createHomeAssignment,
  getStudentHomeAssignments,
  getParentHomeAssignments,
  submitHomeFeedback,
  getHomeMurajaahReport
} from './controllers/homeMurajaahController';
import {
  listDocumentation,
  createDocumentation,
  deleteDocumentation
} from './controllers/sitaDocumentationController';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://talaqqi.ametriyadhi.com'
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Public Auth endpoint
app.post('/api/auth/login', login);
app.get('/api/whitelabel', getWhiteLabel);

// Authenticated Routes
app.get('/api/auth/profile', authenticateJWT, getProfile);
app.get('/api/config', authenticateJWT, getConfig);

// Quran routes
app.get('/api/quran/surahs', authenticateJWT, getSurahs);
app.get('/api/quran/surahs/:surahId/ayahs', authenticateJWT, getAyahs);

// Ustadz student helper endpoint
app.get('/api/ustadz/students', authenticateJWT, authorizeRoles(['ustadz']), async (req: AuthRequest, res) => {
  try {
    const halaqahs = await prisma.halaqah.findMany({
      where: { ustadzId: req.user!.id },
      select: { id: true }
    });
    const halaqahIds = halaqahs.map(h => h.id);

    const halaqahStudents = await prisma.halaqahStudent.findMany({
      where: { halaqahId: { in: halaqahIds } },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nis: true,
            levelId: true,
            level: {
              select: {
                id: true,
                name: true,
                juzCount: true,
                juzList: true,
                targetDays: true
              }
            },
            examsAsStudent: {
              select: {
                id: true,
                juzId: true,
                status: true,
                score: true,
                createdAt: true
              }
            },
            classroomStudents: {
              where: {
                classroom: {
                  academicYear: {
                    isActive: true
                  }
                }
              },
              include: {
                classroom: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const students = halaqahStudents.map(hs => hs.student);
    return res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

app.get('/api/ustadz/halaqahs', authenticateJWT, authorizeRoles(['ustadz']), async (req: AuthRequest, res) => {
  try {
    const halaqahs = await prisma.halaqah.findMany({
      where: { ustadzId: req.user!.id, isActive: true },
      select: { id: true, name: true, description: true }
    });
    return res.json(halaqahs);
  } catch (error) {
    console.error('Error fetching ustadz halaqahs:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// Parent student helper endpoint
app.get('/api/parent/students', authenticateJWT, authorizeRoles(['parent']), async (req: AuthRequest, res) => {
  try {
    const relations = await prisma.studentParent.findMany({
      where: { parentId: req.user!.id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nis: true,
            levelId: true,
            level: {
              select: {
                id: true,
                name: true,
                juzCount: true,
                juzList: true,
                targetDays: true
              }
            },
            classroomStudents: {
              where: {
                classroom: {
                  academicYear: {
                    isActive: true
                  }
                }
              },
              include: {
                classroom: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    const students = relations.map(r => r.student);
    return res.json(students);
  } catch (error) {
    console.error('Error fetching parent students:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// Session routes
app.get('/api/sessions', authenticateJWT, listSessions);
app.get('/api/sessions/:id', authenticateJWT, getSessionDetail);
app.post('/api/sessions/finish', authenticateJWT, authorizeRoles(['ustadz']), finishSession);

// Reports routes
app.get('/api/students/:studentId/heatmap', authenticateJWT, getHeatmap);
app.get('/api/students/:studentId/progress', authenticateJWT, getProgress);

// Admin routes
app.get('/api/admin/config', authenticateJWT, authorizeRoles(['admin']), getConfig);
app.post('/api/admin/config', authenticateJWT, authorizeRoles(['admin']), updateConfig);
app.get('/api/admin/whitelabel', authenticateJWT, authorizeRoles(['admin']), getWhiteLabel);
app.post('/api/admin/whitelabel', authenticateJWT, authorizeRoles(['admin']), updateWhiteLabel);
app.get('/api/admin/levels', authenticateJWT, authorizeRoles(['admin']), getLevels);
app.post('/api/admin/levels', authenticateJWT, authorizeRoles(['admin']), createLevel);
app.put('/api/admin/levels/:id', authenticateJWT, authorizeRoles(['admin']), updateLevel);
app.delete('/api/admin/levels/:id', authenticateJWT, authorizeRoles(['admin']), deleteLevel);
app.post('/api/admin/users/assign-level', authenticateJWT, authorizeRoles(['admin']), assignStudentLevel);
app.get('/api/admin/users', authenticateJWT, authorizeRoles(['admin']), getUsers);
app.post('/api/admin/users', authenticateJWT, authorizeRoles(['admin']), createUser);
app.put('/api/admin/users/:id', authenticateJWT, authorizeRoles(['admin']), updateUser);
app.delete('/api/admin/users/:id', authenticateJWT, authorizeRoles(['admin']), deleteUser);
app.post('/api/admin/users/bulk', authenticateJWT, authorizeRoles(['admin']), createUsersBulk);

// Admin Custom Fields routes
app.get('/api/admin/custom-fields/:role', authenticateJWT, authorizeRoles(['admin']), getCustomFieldsByRole);
app.post('/api/admin/custom-fields', authenticateJWT, authorizeRoles(['admin']), createCustomField);
app.put('/api/admin/custom-fields/:id', authenticateJWT, authorizeRoles(['admin']), updateCustomField);
app.delete('/api/admin/custom-fields/:id', authenticateJWT, authorizeRoles(['admin']), deleteCustomField);
app.get('/api/admin/halaqahs', authenticateJWT, authorizeRoles(['admin']), getHalaqahs);
app.post('/api/admin/halaqahs', authenticateJWT, authorizeRoles(['admin']), createHalaqah);
app.post('/api/admin/halaqahs/:id/students', authenticateJWT, authorizeRoles(['admin']), assignStudentToHalaqah);
app.delete('/api/admin/halaqahs/:id/students/:studentId', authenticateJWT, authorizeRoles(['admin']), removeStudentFromHalaqah);
app.post('/api/admin/users/link-parent', authenticateJWT, authorizeRoles(['admin']), linkParentStudent);
app.get('/api/admin/users/linked-parents', authenticateJWT, authorizeRoles(['admin']), getLinkedParents);
app.get('/api/admin/summary', authenticateJWT, authorizeRoles(['admin']), getInstitutionSummary);

  // Academic & Classroom routes
  app.get('/api/academic-years', authenticateJWT, getAcademicYears);
  app.post('/api/admin/academic-years', authenticateJWT, authorizeRoles(['admin']), createAcademicYear);
  app.put('/api/admin/academic-years/:id/active', authenticateJWT, authorizeRoles(['admin']), setActiveAcademicYear);
  app.delete('/api/admin/academic-years/:id', authenticateJWT, authorizeRoles(['admin']), deleteAcademicYear);

  app.get('/api/classrooms', authenticateJWT, getClassrooms);
  app.post('/api/admin/classrooms', authenticateJWT, authorizeRoles(['admin']), createClassroom);
  app.delete('/api/admin/classrooms/:id', authenticateJWT, authorizeRoles(['admin']), deleteClassroom);
  app.get('/api/classrooms/:id/students', authenticateJWT, getClassroomStudents);
  app.post('/api/admin/classrooms/:id/students', authenticateJWT, authorizeRoles(['admin']), assignStudentsToClassroom);
  app.delete('/api/admin/classrooms/:id/students/:studentId', authenticateJWT, authorizeRoles(['admin']), removeStudentFromClassroom);

  // SubClassroom routes
  app.get('/api/classrooms/:classroomId/sub-classrooms', authenticateJWT, getSubClassrooms);
  app.post('/api/admin/classrooms/:classroomId/sub-classrooms', authenticateJWT, authorizeRoles(['admin']), createSubClassroom);
  app.delete('/api/admin/sub-classrooms/:id', authenticateJWT, authorizeRoles(['admin']), deleteSubClassroom);
  app.get('/api/sub-classrooms/:id/students', authenticateJWT, getSubClassroomStudents);
  app.post('/api/admin/sub-classrooms/:id/students', authenticateJWT, authorizeRoles(['admin']), assignStudentsToSubClassroom);
  app.delete('/api/admin/sub-classrooms/:id/students/:studentId', authenticateJWT, authorizeRoles(['admin']), removeStudentFromSubClassroom);

  // Messages routes
  app.get('/api/messages/:studentId', authenticateJWT, getMessages);
  app.post('/api/messages', authenticateJWT, sendMessage);

  // Home Murajaah (Mutabaah Mandiri) routes
  app.post('/api/home-murajaah/assign', authenticateJWT, authorizeRoles(['ustadz']), createHomeAssignment);
  app.get('/api/home-murajaah/student/:studentId', authenticateJWT, getStudentHomeAssignments);
  app.get('/api/home-murajaah/parent/assignments', authenticateJWT, authorizeRoles(['parent']), getParentHomeAssignments);
  app.post('/api/home-murajaah/feedback/:id', authenticateJWT, authorizeRoles(['parent']), submitHomeFeedback);
  app.get('/api/home-murajaah/report', authenticateJWT, getHomeMurajaahReport);

  // SITA Documentation & Activities routes
  app.get('/api/sita-documentation', authenticateJWT, listDocumentation);
  app.post('/api/admin/sita-documentation', authenticateJWT, authorizeRoles(['admin']), createDocumentation);
  app.delete('/api/admin/sita-documentation/:id', authenticateJWT, authorizeRoles(['admin']), deleteDocumentation);


// Juziyah & Coordinator routes
app.post('/api/juziyah/request', authenticateJWT, authorizeRoles(['ustadz']), requestJuziyahExam);
app.get('/api/juziyah/pending', authenticateJWT, authorizeRoles(['koordinator']), getPendingJuziyahExams);
app.post('/api/juziyah/submit', authenticateJWT, authorizeRoles(['koordinator']), submitJuziyahExamResult);
app.get('/api/juziyah/certificates', authenticateJWT, getCertificates);
app.get('/api/coordinator/summary', authenticateJWT, authorizeRoles(['koordinator']), getCoordinatorSummary);

// Notifications helper endpoint
app.get('/api/notifications', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

app.post('/api/notifications/:id/read', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { id, recipientId: req.user!.id },
      data: { isRead: true }
    });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error reading notification:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// Serve SITA Frontend static files in production
const frontendDistPath = path.join(__dirname, '../../sita-frontend/dist');
app.use(express.static(frontendDistPath));

// Fallback all other routes to React SPA index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SITA Backend running on port ${PORT}`);
});
