/**
 * ═══════════════════════════════════════════════════════════════
 * useQueries — Custom TanStack Query hooks for SITA
 * 
 * Menggantikan pola berulang: useEffect + useState + try/catch + fetch
 * dengan hooks yang memiliki built-in caching, background refetch,
 * loading states, dan error handling.
 *
 * Benefits:
 * - Data di-cache → navigasi ulang ke halaman yang sama = INSTAN
 * - Background refetch → data selalu fresh tanpa loading spinner
 * - Automatic retry → jaringan lambat tetap bekerja
 * - Deduplication → multiple komponen pakai data yang sama = 1 request
 * ═══════════════════════════════════════════════════════════════
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// ─── Query Keys (centralized for consistency) ────────────────
export const queryKeys = {
  // Auth & Profile
  profile: ['profile'] as const,
  
  // Quran
  surahs: ['surahs'] as const,
  ayahs: (surahId: number, start: number, end: number) => ['ayahs', surahId, start, end] as const,

  // Admin
  adminSummary: ['admin', 'summary'] as const,
  adminUsers: ['admin', 'users'] as const,
  adminHalaqahs: ['admin', 'halaqahs'] as const,
  adminConfig: ['admin', 'config'] as const,
  adminLevels: ['admin', 'levels'] as const,
  linkedParents: ['admin', 'linkedParents'] as const,
  customFields: (role: string) => ['admin', 'customFields', role] as const,
  whiteLabel: ['whiteLabel'] as const,

  // Ustadz
  ustadzStudents: ['ustadz', 'students'] as const,
  sessions: ['sessions'] as const,
  sessionDetail: (id: string) => ['sessions', id] as const,
  
  // Student
  studentProgress: (studentId: number) => ['student', 'progress', studentId] as const,
  studentHeatmap: (studentId: number, surahId?: number) => ['student', 'heatmap', studentId, surahId] as const,
  
  // Parent
  parentStudents: ['parent', 'students'] as const,
  
  // Notifications
  notifications: ['notifications'] as const,
  
  // Messages
  messages: (studentId: number) => ['messages', studentId] as const,
  
  // Coordinator
  coordinatorSummary: ['coordinator', 'summary'] as const,
  
  // Juziyah
  pendingJuziyah: ['juziyah', 'pending'] as const,
  certificates: (studentId?: number) => ['juziyah', 'certificates', studentId] as const,

  // Academic Years & Classrooms
  academicYears: ['academic', 'years'] as const,
  classrooms: (academicYearId?: number) => ['academic', 'classrooms', academicYearId] as const,
  classroomStudents: (classroomId: number) => ['academic', 'classrooms', classroomId, 'students'] as const,
  subClassrooms: (classroomId: number) => ['academic', 'subClassrooms', classroomId] as const,
  subClassroomStudents: (subClassroomId: number) => ['academic', 'subClassrooms', subClassroomId, 'students'] as const,
} as const;


// ═══════════════════════════════════════════════════════════════
// ADMIN HOOKS
// ═══════════════════════════════════════════════════════════════

export function useAdminSummary() {
  return useQuery({
    queryKey: queryKeys.adminSummary,
    queryFn: () => api.getAdminSummary(),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: () => api.getAdminUsers(),
  });
}

export function useAdminHalaqahs() {
  return useQuery({
    queryKey: queryKeys.adminHalaqahs,
    queryFn: () => api.getAdminHalaqahs(),
  });
}

export function useAdminConfig() {
  return useQuery({
    queryKey: queryKeys.adminConfig,
    queryFn: () => api.getAdminConfig(),
  });
}

export function useAdminLevels() {
  return useQuery({
    queryKey: queryKeys.adminLevels,
    queryFn: () => api.getAdminLevels(),
  });
}

export function useLinkedParents() {
  return useQuery({
    queryKey: queryKeys.linkedParents,
    queryFn: () => api.getLinkedParents(),
  });
}

export function useCustomFields(role: 'student' | 'ustadz' | 'parent') {
  return useQuery({
    queryKey: queryKeys.customFields(role),
    queryFn: () => api.getCustomFields(role),
  });
}

export function useWhiteLabel() {
  return useQuery({
    queryKey: queryKeys.whiteLabel,
    queryFn: () => api.getWhiteLabel(),
    staleTime: 10 * 60 * 1000, // 10 min — branding rarely changes
  });
}


// ═══════════════════════════════════════════════════════════════
// USTADZ HOOKS
// ═══════════════════════════════════════════════════════════════

export function useUstadzStudents() {
  return useQuery({
    queryKey: queryKeys.ustadzStudents,
    queryFn: () => api.getUstadzStudents(),
  });
}

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.sessions,
    queryFn: () => api.listSessions(),
  });
}


// ═══════════════════════════════════════════════════════════════
// STUDENT HOOKS
// ═══════════════════════════════════════════════════════════════

export function useStudentProgress(studentId: number) {
  return useQuery({
    queryKey: queryKeys.studentProgress(studentId),
    queryFn: () => api.getProgress(studentId),
    enabled: !!studentId,
  });
}

export function useStudentHeatmap(studentId: number, surahId?: number) {
  return useQuery({
    queryKey: queryKeys.studentHeatmap(studentId, surahId),
    queryFn: () => api.getHeatmap(studentId, surahId),
    enabled: !!studentId,
  });
}


// ═══════════════════════════════════════════════════════════════
// PARENT HOOKS
// ═══════════════════════════════════════════════════════════════

export function useParentStudents() {
  return useQuery({
    queryKey: queryKeys.parentStudents,
    queryFn: () => api.getParentStudents(),
  });
}


// ═══════════════════════════════════════════════════════════════
// SHARED HOOKS
// ═══════════════════════════════════════════════════════════════

export function useSurahs() {
  return useQuery({
    queryKey: queryKeys.surahs,
    queryFn: () => api.getSurahs(),
    staleTime: Infinity, // Surah list never changes
    gcTime: Infinity,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => api.getNotifications(),
    refetchInterval: 60 * 1000, // Auto-refresh every 1 min
  });
}

export function useMessages(studentId: number) {
  return useQuery({
    queryKey: queryKeys.messages(studentId),
    queryFn: () => api.getMessages(studentId),
    enabled: !!studentId,
    refetchInterval: 15 * 1000, // Auto-refresh every 15 sec for chat
  });
}


// ═══════════════════════════════════════════════════════════════
// COORDINATOR HOOKS
// ═══════════════════════════════════════════════════════════════

export function useCoordinatorSummary() {
  return useQuery({
    queryKey: queryKeys.coordinatorSummary,
    queryFn: () => api.getCoordinatorSummary(),
  });
}

export function usePendingJuziyah() {
  return useQuery({
    queryKey: queryKeys.pendingJuziyah,
    queryFn: () => api.getPendingJuziyahExams(),
  });
}

export function useCertificates(studentId?: number) {
  return useQuery({
    queryKey: queryKeys.certificates(studentId),
    queryFn: () => api.getCertificates(studentId),
  });
}


// ═══════════════════════════════════════════════════════════════
// MUTATION HOOKS (for create/update/delete with auto cache invalidation)
// ═══════════════════════════════════════════════════════════════

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createAdminUser>[0]) => api.createAdminUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminUsers });
      qc.invalidateQueries({ queryKey: queryKeys.adminSummary });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: any }) => api.updateAdminUser(userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminUsers });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => api.deleteAdminUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminUsers });
      qc.invalidateQueries({ queryKey: queryKeys.adminSummary });
    },
  });
}

export function useCreateHalaqah() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createAdminHalaqah>[0]) => api.createAdminHalaqah(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminHalaqahs });
      qc.invalidateQueries({ queryKey: queryKeys.adminSummary });
    },
  });
}

export function useAssignStudentToHalaqah() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ halaqahId, studentId }: { halaqahId: number; studentId: number }) =>
      api.assignStudentToHalaqah(halaqahId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminHalaqahs });
    },
  });
}

export function useRemoveStudentFromHalaqah() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ halaqahId, studentId }: { halaqahId: number; studentId: number }) =>
      api.removeStudentFromHalaqah(halaqahId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminHalaqahs });
    },
  });
}

export function useLinkParentStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { studentId: number; parentId: number; relationship: string }) =>
      api.linkParentStudent(data.studentId, data.parentId, data.relationship),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.linkedParents });
    },
  });
}

export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.updateAdminConfig>[0]) => api.updateAdminConfig(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminConfig });
    },
  });
}

export function useUpdateWhiteLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.updateWhiteLabel>[0]) => api.updateWhiteLabel(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.whiteLabel });
    },
  });
}

export function useCreateCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createCustomField>[0]) => api.createCustomField(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.customFields(variables.role) });
    },
  });
}

export function useUpdateCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fieldId, data }: { fieldId: number; data: Parameters<typeof api.updateCustomField>[1] }) =>
      api.updateCustomField(fieldId, data),
    onSuccess: () => {
      // Invalidate all custom field caches
      qc.invalidateQueries({ queryKey: ['admin', 'customFields'] });
    },
  });
}

export function useDeleteCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fieldId: number) => api.deleteCustomField(fieldId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'customFields'] });
    },
  });
}

export function useFinishSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.finishSession>[0]) => api.finishSession(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions });
      qc.invalidateQueries({ queryKey: queryKeys.ustadzStudents });
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { studentId: number; receiverId: number | null; content: string }) =>
      api.sendMessage(data.studentId, data.receiverId, data.content),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.messages(variables.studentId) });
    },
  });
}

export function useSubmitJuziyahExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.submitJuziyahExamResult>[0]) => api.submitJuziyahExamResult(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pendingJuziyah });
      qc.invalidateQueries({ queryKey: ['juziyah', 'certificates'] });
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.markNotificationAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

export function useRequestJuziyahExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { studentId: number; juzId: number }) => api.requestJuziyahExam(data.studentId, data.juzId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ustadzStudents });
      qc.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}


// ═══════════════════════════════════════════════════════════════
// ACADEMIC YEAR & CLASSROOM HOOKS
// ═══════════════════════════════════════════════════════════════

export function useAcademicYears() {
  return useQuery({
    queryKey: queryKeys.academicYears,
    queryFn: () => api.getAcademicYears(),
  });
}

export function useClassrooms(academicYearId?: number) {
  return useQuery({
    queryKey: queryKeys.classrooms(academicYearId),
    queryFn: () => api.getClassrooms(academicYearId),
    enabled: true,
  });
}

export function useClassroomStudents(classroomId: number) {
  return useQuery({
    queryKey: queryKeys.classroomStudents(classroomId),
    queryFn: () => api.getClassroomStudents(classroomId),
    enabled: !!classroomId,
  });
}

export function useCreateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createAcademicYear(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.academicYears });
    },
  });
}

export function useSetActiveAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.setActiveAcademicYear(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.academicYears });
    },
  });
}

export function useDeleteAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteAcademicYear(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.academicYears });
      qc.invalidateQueries({ queryKey: ['academic', 'classrooms'] });
    },
  });
}

export function useCreateClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, academicYearId }: { name: string; academicYearId: number }) =>
      api.createClassroom(name, academicYearId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'classrooms'] });
    },
  });
}

export function useDeleteClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteClassroom(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic', 'classrooms'] });
    },
  });
}

export function useAssignStudentsToClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classroomId, studentIds }: { classroomId: number; studentIds: number[] }) =>
      api.assignStudentsToClassroom(classroomId, studentIds),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.classroomStudents(variables.classroomId) });
      qc.invalidateQueries({ queryKey: ['academic', 'classrooms'] });
    },
  });
}

export function useRemoveStudentFromClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classroomId, studentId }: { classroomId: number; studentId: number }) =>
      api.removeStudentFromClassroom(classroomId, studentId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.classroomStudents(variables.classroomId) });
      qc.invalidateQueries({ queryKey: ['academic', 'classrooms'] });
    },
  });
}

// ─── SUB CLASSROOMS (SUB KELAS) HOOKS ───────────────

export function useSubClassrooms(classroomId: number) {
  return useQuery({
    queryKey: queryKeys.subClassrooms(classroomId),
    queryFn: () => api.getSubClassrooms(classroomId),
    enabled: !!classroomId,
  });
}

export function useSubClassroomStudents(subClassroomId: number) {
  return useQuery({
    queryKey: queryKeys.subClassroomStudents(subClassroomId),
    queryFn: () => api.getSubClassroomStudents(subClassroomId),
    enabled: !!subClassroomId,
  });
}

export function useCreateSubClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, classroomId }: { name: string; classroomId: number }) =>
      api.createSubClassroom(name, classroomId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.subClassrooms(variables.classroomId) });
      qc.invalidateQueries({ queryKey: ['academic', 'classrooms'] });
    },
  });
}

export function useDeleteSubClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, classroomId }: { id: number; classroomId: number }) =>
      api.deleteSubClassroom(id),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.subClassrooms(variables.classroomId) });
      qc.invalidateQueries({ queryKey: ['academic', 'classrooms'] });
    },
  });
}

export function useAssignStudentsToSubClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subClassroomId, studentIds }: { subClassroomId: number; studentIds: number[] }) =>
      api.assignStudentsToSubClassroom(subClassroomId, studentIds),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.subClassroomStudents(variables.subClassroomId) });
    },
  });
}

export function useRemoveStudentFromSubClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subClassroomId, studentId }: { subClassroomId: number; studentId: number }) =>
      api.removeStudentFromSubClassroom(subClassroomId, studentId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.subClassroomStudents(variables.subClassroomId) });
    },
  });
}
export function useUstadzHalaqahs() {
  return useQuery({
    queryKey: ['ustadz', 'halaqahs'] as const,
    queryFn: () => api.getUstadzHalaqahs()
  });
}

// ─── HOME MURAJAAH (MUTABAAH HARIAN) HOOKS ───────────

export function useStudentHomeAssignments(studentId: number) {
  return useQuery({
    queryKey: ['homeAssignments', 'student', studentId],
    queryFn: () => api.getStudentHomeAssignments(studentId),
    enabled: !!studentId
  });
}

export function useParentHomeAssignments() {
  return useQuery({
    queryKey: ['homeAssignments', 'parent'],
    queryFn: () => api.getParentHomeAssignments()
  });
}

export function useHomeMurajaahReport() {
  return useQuery({
    queryKey: ['homeAssignments', 'report'],
    queryFn: () => api.getHomeMurajaahReport()
  });
}

export function useAssignHomeMurajaah() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      studentId?: number;
      halaqahId?: number;
      assignedDate: string;
      shift: string;
      targetType: string;
      targetName: string;
    }) => api.assignHomeMurajaah(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homeAssignments', 'report'] });
    }
  });
}

export function useSubmitHomeFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: {
      id: string;
      data: {
        isExecuted: boolean;
        isTargetMet: boolean;
        isFluent: boolean;
        parentSignature: string;
        parentNotes?: string;
      }
    }) => api.submitHomeFeedback(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homeAssignments', 'parent'] });
      qc.invalidateQueries({ queryKey: ['homeAssignments', 'report'] });
    }
  });
}

// ─── SITA DOCUMENTATION HOOKS ───────────────────────

export function useSitaDocumentation() {
  return useQuery({
    queryKey: ['sitaDocumentation'] as const,
    queryFn: () => api.getSitaDocumentation()
  });
}

export function useCreateSitaDocumentation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; imageUrl: string; tag?: string }) =>
      api.createSitaDocumentation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sitaDocumentation'] });
    }
  });
}

export function useDeleteSitaDocumentation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteSitaDocumentation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sitaDocumentation'] });
    }
  });
}


