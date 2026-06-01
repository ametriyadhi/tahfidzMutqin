const API_BASE = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && 
  window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1'
    ? `${window.location.origin}/api`
    : 'http://localhost:7610/api'
);

class ApiClient {
  private token: string | null = localStorage.getItem('sita_token');

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('sita_token', token);
  }

  getToken() {
    return this.token;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('sita_token');
    localStorage.removeItem('sita_user');
  }

  getUser() {
    const userStr = localStorage.getItem('sita_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  setUser(user: any) {
    localStorage.setItem('sita_user', JSON.stringify(user));
  }

  private async request(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }
    if (options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.logout();
        // Redirect to login if on client side
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Terjadi kesalahan');
    }

    return response.json();
  }

  login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then((res) => {
      this.setToken(res.token);
      this.setUser(res.user);
      return res.user;
    });
  }

  getProfile() {
    return this.request('/auth/profile');
  }

  getSurahs() {
    return this.request('/quran/surahs');
  }

  getAyahs(surahId: number, start: number, end: number) {
    return this.request(`/quran/surahs/${surahId}/ayahs?from=${start}&to=${end}`);
  }

  getUstadzStudents() {
    return this.request('/ustadz/students');
  }

  getParentStudents() {
    return this.request('/parent/students');
  }

  listSessions() {
    return this.request('/sessions');
  }

  getSessionDetail(id: string) {
    return this.request(`/sessions/${id}`);
  }

  finishSession(data: {
    studentId: number;
    surahId: number;
    startAyah: number;
    endAyah: number;
    sessionType: 'setoran_baru' | 'murajaah' | 'tasmi_mandiri' | 'tasmi_teman' | 'tasmi';
    errors: any[];
    notesUstadz?: string;
    juzId?: number;
    setoranScope?: 'halaman' | 'seperempat_juz' | 'setengah_juz' | 'tiga_perempat_juz' | 'quarter_juz' | 'half_juz' | 'three_quarter_juz' | 'tasmi_juz' | 'range_halaman';
    pageNumber?: number;
    startPage?: number;
    endPage?: number;
    scoreFinal?: number;
    status?: 'lulus' | 'mengulang';
  }) {
    return this.request('/sessions/finish', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getHeatmap(studentId: number, surahId?: number) {
    const query = surahId ? `?surah_id=${surahId}` : '';
    return this.request(`/students/${studentId}/heatmap${query}`);
  }

  getProgress(studentId: number) {
    return this.request(`/students/${studentId}/progress`);
  }

  getNotifications() {
    return this.request('/notifications');
  }

  getAdminConfig() {
    return this.request('/config');
  }

  updateAdminConfig(data: {
    scoreInitial: number;
    penaltyJali: number;
    penaltyKhafi: number;
    penaltyTark: number;
    passThreshold: number;
  }) {
    return this.request('/admin/config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getWhiteLabel() {
    return this.request('/whitelabel');
  }

  updateWhiteLabel(data: {
    appName: string;
    footerText: string;
    appLogo?: string | null;
    loginLogo?: string | null;
  }) {
    return this.request('/admin/whitelabel', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getAdminLevels() {
    return this.request('/admin/levels');
  }

  createAdminLevel(data: { name: string; juzCount: number; juzList: string; targetDays: number }) {
    return this.request('/admin/levels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateAdminLevel(id: number, data: { name: string; juzCount: number; juzList: string; targetDays: number }) {
    return this.request(`/admin/levels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteAdminLevel(id: number) {
    return this.request(`/admin/levels/${id}`, {
      method: 'DELETE',
    });
  }

  assignStudentLevel(studentId: number, levelId: number | null) {
    return this.request('/admin/users/assign-level', {
      method: 'POST',
      body: JSON.stringify({ studentId, levelId }),
    });
  }

  getAdminUsers() {
    return this.request('/admin/users');
  }

  createAdminUser(data: {
    name: string;
    email: string;
    password?: string;
    role: string;
    nis?: string;
  }) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getAdminHalaqahs() {
    return this.request('/admin/halaqahs');
  }

  createAdminHalaqah(data: {
    name: string;
    ustadzId: number;
    description?: string;
  }) {
    return this.request('/admin/halaqahs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  assignStudentToHalaqah(halaqahId: number, studentId: number) {
    return this.request(`/admin/halaqahs/${halaqahId}/students`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    });
  }

  removeStudentFromHalaqah(halaqahId: number, studentId: number) {
    return this.request(`/admin/halaqahs/${halaqahId}/students/${studentId}`, {
      method: 'DELETE',
    });
  }

  linkParentStudent(studentId: number, parentId: number, relationship: string) {
    return this.request('/admin/users/link-parent', {
      method: 'POST',
      body: JSON.stringify({ studentId, parentId, relationship }),
    });
  }

  getLinkedParents() {
    return this.request('/admin/users/linked-parents');
  }

  createAdminUsersBulk(users: any[]) {
    return this.request('/admin/users/bulk', {
      method: 'POST',
      body: JSON.stringify({ users }),
    });
  }

  markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  getAdminSummary() {
    return this.request('/admin/summary');
  }

  getMessages(studentId: number) {
    return this.request(`/messages/${studentId}`);
  }

  sendMessage(studentId: number, receiverId: number | null, content: string) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify({ studentId, receiverId, content }),
    });
  }

  requestJuziyahExam(studentId: number, juzId: number) {
    return this.request('/juziyah/request', {
      method: 'POST',
      body: JSON.stringify({ studentId, juzId }),
    });
  }

  getPendingJuziyahExams() {
    return this.request('/juziyah/pending');
  }

  submitJuziyahExamResult(data: {
    examId: string;
    score: number;
    status: 'lulus' | 'mengulang';
    notes?: string;
  }) {
    return this.request('/juziyah/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getCertificates(studentId?: number) {
    const query = studentId ? `?studentId=${studentId}` : '';
    return this.request(`/juziyah/certificates${query}`);
  }

  getCoordinatorSummary() {
    return this.request('/coordinator/summary');
  }

  updateAdminUser(userId: number, data: any) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteAdminUser(userId: number) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  getCustomFields(role: 'ustadz' | 'student' | 'parent') {
    return this.request(`/admin/custom-fields/${role}`);
  }

  createCustomField(data: {
    role: string;
    fieldName: string;
    fieldType: string;
    options?: string | null;
    isRequired?: boolean;
  }) {
    return this.request('/admin/custom-fields', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateCustomField(fieldId: number, data: {
    fieldName?: string;
    fieldType?: string;
    options?: string | null;
    isRequired?: boolean;
  }) {
    return this.request(`/admin/custom-fields/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteCustomField(fieldId: number) {
    return this.request(`/admin/custom-fields/${fieldId}`, {
      method: 'DELETE',
    });
  }

  // ─── ACADEMIC YEARS (TAHUN PELAJARAN) ───────────────────
  getAcademicYears() {
    return this.request('/academic-years');
  }

  createAcademicYear(name: string) {
    return this.request('/admin/academic-years', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  setActiveAcademicYear(id: number) {
    return this.request(`/admin/academic-years/${id}/active`, {
      method: 'PUT',
    });
  }

  deleteAcademicYear(id: number) {
    return this.request(`/admin/academic-years/${id}`, {
      method: 'DELETE',
    });
  }

  // ─── CLASSROOMS (KELAS) ───────────────────────────
  getClassrooms(academicYearId?: number) {
    const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
    return this.request(`/classrooms${query}`);
  }

  createClassroom(name: string, academicYearId: number) {
    return this.request('/admin/classrooms', {
      method: 'POST',
      body: JSON.stringify({ name, academicYearId }),
    });
  }

  deleteClassroom(id: number) {
    return this.request(`/admin/classrooms/${id}`, {
      method: 'DELETE',
    });
  }

  getClassroomStudents(classroomId: number) {
    return this.request(`/classrooms/${classroomId}/students`);
  }

  assignStudentsToClassroom(classroomId: number, studentIds: number[]) {
    return this.request(`/admin/classrooms/${classroomId}/students`, {
      method: 'POST',
      body: JSON.stringify({ studentIds }),
    });
  }

  removeStudentFromClassroom(classroomId: number, studentId: number) {
    return this.request(`/admin/classrooms/${classroomId}/students/${studentId}`, {
      method: 'DELETE',
    });
  }

  // ─── SUB CLASSROOMS (SUB KELAS) ────────────────────
  getSubClassrooms(classroomId: number) {
    return this.request(`/classrooms/${classroomId}/sub-classrooms`);
  }

  createSubClassroom(name: string, classroomId: number) {
    return this.request(`/admin/classrooms/${classroomId}/sub-classrooms`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  deleteSubClassroom(id: number) {
    return this.request(`/admin/sub-classrooms/${id}`, {
      method: 'DELETE',
    });
  }

  getSubClassroomStudents(subClassroomId: number) {
    return this.request(`/sub-classrooms/${subClassroomId}/students`);
  }

  assignStudentsToSubClassroom(subClassroomId: number, studentIds: number[]) {
    return this.request(`/admin/sub-classrooms/${subClassroomId}/students`, {
      method: 'POST',
      body: JSON.stringify({ studentIds }),
    });
  }

  removeStudentFromSubClassroom(subClassroomId: number, studentId: number) {
    return this.request(`/admin/sub-classrooms/${subClassroomId}/students/${studentId}`, {
      method: 'DELETE',
    });
  }

  // ─── HOME MURAJAAH (MUTABAAH HARIAN) ────────────────
  assignHomeMurajaah(data: {
    studentId?: number;
    halaqahId?: number;
    assignedDate: string;
    shift: string;
    targetType: string;
    targetName: string;
  }) {
    return this.request('/home-murajaah/assign', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  getStudentHomeAssignments(studentId: number) {
    return this.request(`/home-murajaah/student/${studentId}`);
  }

  getParentHomeAssignments() {
    return this.request('/home-murajaah/parent/assignments');
  }

  submitHomeFeedback(id: string, data: {
    isExecuted: boolean;
    isTargetMet: boolean;
    isFluent: boolean;
    parentSignature: string;
    parentNotes?: string;
  }) {
    return this.request(`/home-murajaah/feedback/${id}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  getHomeMurajaahReport() {
    return this.request('/home-murajaah/report');
  }

  getUstadzHalaqahs() {
    return this.request('/ustadz/halaqahs');
  }

  // ─── SITA DOCUMENTATION & ACTIVITIES ────────────────
  getSitaDocumentation() {
    return this.request('/sita-documentation');
  }

  createSitaDocumentation(data: { title: string; imageUrl: string; tag?: string }) {
    return this.request('/admin/sita-documentation', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  deleteSitaDocumentation(id: number) {
    return this.request(`/admin/sita-documentation/${id}`, {
      method: 'DELETE'
    });
  }
}

export const api = new ApiClient();
