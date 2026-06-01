import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { LogOut, Settings, Users, Home, Plus, Shield, LayoutDashboard, BookOpen, Menu, X, ArrowRight, Award, GraduationCap, ChevronRight, ChevronLeft, ChevronDown, Trash2, Edit2, Wrench, Database, Calendar, School, Camera } from 'lucide-react';
import { NotificationCenter } from '../components/NotificationCenter';
import { useBranding } from '../context/BrandingContext';
import {
  useAdminSummary, useAdminUsers, useAdminHalaqahs, useAdminConfig,
  useAdminLevels, useLinkedParents, useCustomFields, queryKeys,
  useAcademicYears, useClassrooms, useCreateAcademicYear, useSetActiveAcademicYear,
  useDeleteAcademicYear, useCreateClassroom, useDeleteClassroom,
  useAssignStudentsToClassroom, useRemoveStudentFromClassroom, useClassroomStudents,
  useSubClassrooms, useSubClassroomStudents, useCreateSubClassroom, useDeleteSubClassroom,
  useAssignStudentsToSubClassroom, useRemoveStudentFromSubClassroom,
  useSitaDocumentation, useCreateSitaDocumentation, useDeleteSitaDocumentation
} from '../hooks/useQueries';
import { LoadingFallback } from '../components/LoadingFallback';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = api.getUser();

  const { appName, appLogo, loginLogo, footerText, refreshBranding, setPageTitle } = useBranding();

  const [activeTab, setActiveTab] = useState<'summary' | 'config' | 'users' | 'halaqah' | 'whitelabel' | 'levels' | 'academic' | 'documentation'>('summary');
  const [masterDataRoleTab, setMasterDataRoleTab] = useState<'ustadz' | 'student' | 'parent'>('student');
  // ═══ TanStack Query — data fetching with caching ═══
  const { data: summaryStats, isLoading: isLoadingSummary } = useAdminSummary();
  const { data: usersList = [], isLoading: isLoadingUsers } = useAdminUsers();
  const { data: halaqahList = [], isLoading: isLoadingHalaqahs } = useAdminHalaqahs();
  const { data: configData, isLoading: isLoadingConfig } = useAdminConfig();
  const { data: levelsList = [], isLoading: isLoadingLevels } = useAdminLevels();
  const { data: linkedParents = [], isLoading: isLoadingLinkedParents } = useLinkedParents();
  const { data: studentCf = [], isLoading: cfLoadingStudent } = useCustomFields('student');
  const { data: ustadzCf = [], isLoading: cfLoadingUstadz } = useCustomFields('ustadz');
  const { data: parentCf = [], isLoading: cfLoadingParent } = useCustomFields('parent');
  const cfLoading = cfLoadingStudent || cfLoadingUstadz || cfLoadingParent;
  const customFields: Record<string, any[]> = {
    student: studentCf, ustadz: ustadzCf, parent: parentCf
  };

  // All UI state — must come BEFORE any conditional return
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // White Label Form State
  const [wlAppName, setWlAppName] = useState('');
  const [wlFooterText, setWlFooterText] = useState('');
  const [wlAppLogo, setWlAppLogo] = useState<string | null>(null);
  const [wlLoginLogo, setWlLoginLogo] = useState<string | null>(null);
  const [wlSaving, setWlSaving] = useState(false);

  // Documentation Form State
  const [docTitle, setDocTitle] = useState('');
  const [docTag, setDocTag] = useState('');
  const [docImage, setDocImage] = useState<string | null>(null);
  const [docSaving, setDocSaving] = useState(false);

  const { data: uploadedPhotos = [], isLoading: isLoadingPhotos } = useSitaDocumentation();
  const createDocMutation = useCreateSitaDocumentation();
  const deleteDocMutation = useDeleteSitaDocumentation();

  const handlePhotoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2.5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 2.5MB.');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDocumentation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docImage) {
      alert('Judul dan foto wajib diisi.');
      return;
    }
    
    setDocSaving(true);
    try {
      await createDocMutation.mutateAsync({
        title: docTitle.trim(),
        tag: docTag.trim() || undefined,
        imageUrl: docImage
      });
      setDocTitle('');
      setDocTag('');
      setDocImage(null);
      const fileInput = document.getElementById('doc-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      alert('Dokumentasi berhasil diunggah.');
    } catch (err: any) {
      alert('Gagal mengunggah dokumentasi: ' + err.message);
    } finally {
      setDocSaving(false);
    }
  };

  const handleDeleteDocumentation = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus dokumentasi ini?')) return;
    try {
      await deleteDocMutation.mutateAsync(id);
      alert('Dokumentasi berhasil dihapus.');
    } catch (err: any) {
      alert('Gagal menghapus dokumentasi: ' + err.message);
    }
  };

  useEffect(() => {
    setPageTitle(
      activeTab === 'summary' ? 'Ringkasan Lembaga'
        : activeTab === 'config' ? 'Konfigurasi Penilaian'
        : activeTab === 'users' ? 'Manajemen Pengguna'
        : activeTab === 'halaqah' ? 'Manajemen Halaqah'
        : activeTab === 'levels' ? 'Level & Target Hafalan'
        : activeTab === 'academic' ? 'Tahun Pelajaran & Kelas'
        : activeTab === 'documentation' ? 'Dokumentasi & Kegiatan SITA'
        : 'Pengaturan White Label'
    );
  }, [activeTab, appName]);

  useEffect(() => {
    const handleOpenMembers = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setSelectedSubClassroomForMembers(customEvent.detail);
        setShowSubClassroomMembersModal(true);
      }
    };
    window.addEventListener('open-subclassroom-members', handleOpenMembers);
    return () => window.removeEventListener('open-subclassroom-members', handleOpenMembers);
  }, []);

  useEffect(() => {
    if (activeTab === 'whitelabel') {
      setWlAppName(appName);
      setWlFooterText(footerText);
      setWlAppLogo(appLogo);
      setWlLoginLogo(loginLogo);
    }
  }, [activeTab, appName, footerText, appLogo, loginLogo]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'app' | 'login') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      alert('Ukuran berkas logo tidak boleh melebihi 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (target === 'app') {
        setWlAppLogo(reader.result as string);
      } else {
        setWlLoginLogo(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveWhiteLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wlAppName.trim()) {
      alert('Nama aplikasi wajib diisi.');
      return;
    }
    setWlSaving(true);
    api.updateWhiteLabel({
      appName: wlAppName,
      footerText: wlFooterText,
      appLogo: wlAppLogo,
      loginLogo: wlLoginLogo,
    })
      .then(() => {
        alert('Pengaturan White Label berhasil disimpan!');
        refreshBranding();
      })
      .catch((err) => {
        alert('Gagal menyimpan White Label: ' + err.message);
      })
      .finally(() => {
        setWlSaving(false);
      });
  };

  // Config State (initialized from TanStack Query data)
  const [scoreInitial, setScoreInitial] = useState(100);
  const [penaltyJali, setPenaltyJali] = useState(3);
  const [penaltyKhafi, setPenaltyKhafi] = useState(1);
  const [penaltyTark, setPenaltyTark] = useState(2);
  const [passThreshold, setPassThreshold] = useState(80);

  // Sync config form state when data loads
  useEffect(() => {
    if (configData) {
      setScoreInitial(configData.scoreInitial);
      setPenaltyJali(configData.penaltyJali);
      setPenaltyKhafi(configData.penaltyKhafi);
      setPenaltyTark(configData.penaltyTark);
      setPassThreshold(configData.passThreshold);
    }
  }, [configData]);

  // Modals/Forms State
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password123');
  const [newUserRole, setNewUserRole] = useState('student');
  const [newUserNis, setNewUserNis] = useState('');

  const [showHalaqahModal, setShowHalaqahModal] = useState(false);
  const [newHalaqahName, setNewHalaqahName] = useState('');
  const [newHalaqahUstadzId, setNewHalaqahUstadzId] = useState('');
  const [newHalaqahDesc, setNewHalaqahDesc] = useState('');

  // Sub-tabs & modal state extensions
  const [userSubTab, setUserSubTab] = useState<'masterdata' | 'link' | 'import'>('masterdata');
  const [linkStudentId, setLinkStudentId] = useState('');
  const [linkParentId, setLinkParentId] = useState('');
  const [linkRelationship, setLinkRelationship] = useState('ayah');
  
  const [importCsvText, setImportCsvText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);

  // --- Custom Field & Edit User State ---

  // Custom Field Builder Modal
  const [showCfBuilderModal, setShowCfBuilderModal] = useState(false);
  const [cfBuilderRole, setCfBuilderRole] = useState<'ustadz' | 'student' | 'parent'>('student');
  const [showCfFormModal, setShowCfFormModal] = useState(false);
  const [cfFormEditing, setCfFormEditing] = useState<any | null>(null);
  const [cfFormName, setCfFormName] = useState('');
  const [cfFormType, setCfFormType] = useState('text');
  const [cfFormOptions, setCfFormOptions] = useState('');
  const [cfFormRequired, setCfFormRequired] = useState(false);
  const [cfFormSaving, setCfFormSaving] = useState(false);

  // Edit User Modal
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserNis, setEditUserNis] = useState('');
  const [editUserIsActive, setEditUserIsActive] = useState(true);
  const [editUserCustomFields, setEditUserCustomFields] = useState<Record<string, string>>({});
  const [editUserSaving, setEditUserSaving] = useState(false);

  // Dynamic Custom Field values state for Add User form
  const [newUserCustomFields, setNewUserCustomFields] = useState<Record<string, string>>({});

  const [selectedHalaqahForMembers, setSelectedHalaqahForMembers] = useState<any | null>(null);
  const [newMemberStudentId, setNewMemberStudentId] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);

  // Memorization Levels States
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedLevelForEdit, setSelectedLevelForEdit] = useState<any | null>(null);
  
  const [levelFormName, setLevelFormName] = useState('');

  const [levelFormJuzList, setLevelFormJuzList] = useState<number[]>([]);
  const [levelFormTargetDays, setLevelFormTargetDays] = useState(30);
  const [levelSaving, setLevelSaving] = useState(false);

  // Student Assignment States
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignLevelId, setAssignLevelId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // ─── Academic Year & Classroom State ───────────────────────
  const { data: academicYears = [] } = useAcademicYears();
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | undefined>(undefined);
  const { data: classrooms = [] } = useClassrooms(selectedAcademicYearId);

  const createAcademicYear = useCreateAcademicYear();
  const setActiveAcademicYear = useSetActiveAcademicYear();
  const deleteAcademicYear = useDeleteAcademicYear();
  const createClassroom = useCreateClassroom();
  const deleteClassroom = useDeleteClassroom();
  const assignStudentsToClassroom = useAssignStudentsToClassroom();
  const removeStudentFromClassroom = useRemoveStudentFromClassroom();

  // SubClassroom hooks & state
  const createSubClassroom = useCreateSubClassroom();
  const assignStudentsToSubClassroom = useAssignStudentsToSubClassroom();
  const removeStudentFromSubClassroom = useRemoveStudentFromSubClassroom();

  const [expandedClassroomId, setExpandedClassroomId] = useState<number | null>(null);

  const [showSubClassroomModal, setShowSubClassroomModal] = useState(false);
  const [selectedClassroomForSub, setSelectedClassroomForSub] = useState<any | null>(null);
  const [newSubClassroomName, setNewSubClassroomName] = useState('');

  const [showSubClassroomMembersModal, setShowSubClassroomMembersModal] = useState(false);
  const [selectedSubClassroomForMembers, setSelectedSubClassroomForMembers] = useState<any | null>(null);
  const { data: subClassroomMembersList = [] } = useSubClassroomStudents(selectedSubClassroomForMembers?.id || 0);
  const [newSubClassroomMemberStudentId, setNewSubClassroomMemberStudentId] = useState('');

  const [newAcademicYearName, setNewAcademicYearName] = useState('');
  const [showAcademicYearModal, setShowAcademicYearModal] = useState(false);

  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [newClassroomName, setNewClassroomName] = useState('');
  const [newClassroomAcademicYearId, setNewClassroomAcademicYearId] = useState('');

  const [showClassroomMembersModal, setShowClassroomMembersModal] = useState(false);
  const [selectedClassroomForMembers, setSelectedClassroomForMembers] = useState<any | null>(null);
  const { data: classroomMembersList = [] } = useClassroomStudents(selectedClassroomForMembers?.id || 0);
  const [newClassroomMemberStudentId, setNewClassroomMemberStudentId] = useState('');

  const handleCreateAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcademicYearName.trim()) return;
    try {
      await createAcademicYear.mutateAsync(newAcademicYearName.trim());
      setNewAcademicYearName('');
      setShowAcademicYearModal(false);
    } catch (err: any) {
      alert('Gagal menambahkan tahun pelajaran: ' + err.message);
    }
  };

  const handleSetActiveAcademicYear = async (id: number) => {
    if (!window.confirm('Aktifkan tahun pelajaran ini? Tahun pelajaran lain akan dinonaktifkan.')) return;
    try {
      await setActiveAcademicYear.mutateAsync(id);
    } catch (err: any) {
      alert('Gagal mengaktifkan tahun pelajaran: ' + err.message);
    }
  };

  const handleDeleteAcademicYear = async (id: number) => {
    if (!window.confirm('Hapus tahun pelajaran ini beserta semua kelas di dalamnya?')) return;
    try {
      await deleteAcademicYear.mutateAsync(id);
      if (selectedAcademicYearId === id) setSelectedAcademicYearId(undefined);
    } catch (err: any) {
      alert('Gagal menghapus tahun pelajaran: ' + err.message);
    }
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassroomName.trim() || !newClassroomAcademicYearId) return;
    try {
      await createClassroom.mutateAsync({
        name: newClassroomName.trim(),
        academicYearId: parseInt(newClassroomAcademicYearId)
      });
      setNewClassroomName('');
      setNewClassroomAcademicYearId('');
      setShowClassroomModal(false);
    } catch (err: any) {
      alert('Gagal membuat kelas: ' + err.message);
    }
  };

  const handleDeleteClassroom = async (id: number) => {
    if (!window.confirm('Hapus kelas ini beserta semua data sub-kelas di dalamnya?')) return;
    try {
      await deleteClassroom.mutateAsync(id);
    } catch (err: any) {
      alert('Gagal menghapus kelas: ' + err.message);
    }
  };

  // SubClassroom Handler Methods
  const handleOpenCreateSubClassroom = (classroom: any) => {
    setSelectedClassroomForSub(classroom);
    setNewSubClassroomName('');
    setShowSubClassroomModal(true);
  };

  const handleCreateSubClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroomForSub || !newSubClassroomName.trim()) return;
    try {
      await createSubClassroom.mutateAsync({
        name: newSubClassroomName.trim(),
        classroomId: selectedClassroomForSub.id
      });
      setNewSubClassroomName('');
      setShowSubClassroomModal(false);
      setExpandedClassroomId(selectedClassroomForSub.id); // Expand the classroom to show new sub-classroom
    } catch (err: any) {
      alert('Gagal membuat sub-kelas: ' + err.message);
    }
  };

  const handleAssignStudentToSubClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubClassroomForMembers || !newSubClassroomMemberStudentId) return;
    try {
      await assignStudentsToSubClassroom.mutateAsync({
        subClassroomId: selectedSubClassroomForMembers.id,
        studentIds: [parseInt(newSubClassroomMemberStudentId)]
      });
      setNewSubClassroomMemberStudentId('');
    } catch (err: any) {
      alert('Gagal menambahkan santri ke sub-kelas: ' + err.message);
    }
  };

  const handleRemoveStudentFromSubClassroom = async (studentId: number) => {
    if (!selectedSubClassroomForMembers) return;
    if (!window.confirm('Keluarkan santri ini dari sub-kelas?')) return;
    try {
      await removeStudentFromSubClassroom.mutateAsync({
        subClassroomId: selectedSubClassroomForMembers.id,
        studentId
      });
    } catch (err: any) {
      alert('Gagal mengeluarkan santri dari sub-kelas: ' + err.message);
    }
  };

  const handleAssignStudentToClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroomForMembers || !newClassroomMemberStudentId) return;
    try {
      await assignStudentsToClassroom.mutateAsync({
        classroomId: selectedClassroomForMembers.id,
        studentIds: [parseInt(newClassroomMemberStudentId)]
      });
      setNewClassroomMemberStudentId('');
    } catch (err: any) {
      alert('Gagal menambahkan santri ke kelas: ' + err.message);
    }
  };

  const handleRemoveStudentFromClassroom = async (studentId: number) => {
    if (!selectedClassroomForMembers) return;
    if (!window.confirm('Keluarkan santri ini dari kelas?')) return;
    try {
      await removeStudentFromClassroom.mutateAsync({
        classroomId: selectedClassroomForMembers.id,
        studentId
      });
    } catch (err: any) {
      alert('Gagal mengeluarkan santri dari kelas: ' + err.message);
    }
  };

  useEffect(() => {
    const currentUser = api.getUser();
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // All hooks declared above. Now we can safely do conditional early return.
  const isInitialLoading = isLoadingSummary || isLoadingUsers || isLoadingHalaqahs || isLoadingConfig || isLoadingLevels || isLoadingLinkedParents;
  if (isInitialLoading) {
    return <LoadingFallback />;
  }

  // Helper: invalidate queries to replace old loadX() pattern
  const invalidate = (...keys: readonly (readonly any[])[]) => {
    keys.forEach(k => qc.invalidateQueries({ queryKey: k as any }));
  };

  const openCfBuilder = (role: 'ustadz' | 'student' | 'parent') => {
    setCfBuilderRole(role);
    invalidate(queryKeys.customFields(role));
    setShowCfBuilderModal(true);
  };

  const openCfForm = (field: any | null = null) => {
    setCfFormEditing(field);
    setCfFormName(field?.fieldName || '');
    setCfFormType(field?.fieldType || 'text');
    setCfFormOptions(field?.options || '');
    setCfFormRequired(field?.isRequired || false);
    setShowCfFormModal(true);
  };

  const handleSaveCf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfFormName.trim()) { alert('Nama field wajib diisi.'); return; }
    setCfFormSaving(true);
    try {
      if (cfFormEditing) {
        await api.updateCustomField(cfFormEditing.id, {
          fieldName: cfFormName,
          fieldType: cfFormType,
          options: cfFormType === 'select' ? cfFormOptions : null,
          isRequired: cfFormRequired,
        });
      } else {
        await api.createCustomField({
          role: cfBuilderRole,
          fieldName: cfFormName,
          fieldType: cfFormType,
          options: cfFormType === 'select' ? cfFormOptions : null,
          isRequired: cfFormRequired,
        });
      }
      setShowCfFormModal(false);
      invalidate(queryKeys.customFields(cfBuilderRole));
    } catch (err: any) {
      alert('Gagal menyimpan custom field: ' + err.message);
    } finally {
      setCfFormSaving(false);
    }
  };

  const handleDeleteCf = async (fieldId: number) => {
    if (!window.confirm('Hapus field kustom ini? Seluruh nilai yang tersimpan akan ikut terhapus.')) return;
    try {
      await api.deleteCustomField(fieldId);
      invalidate(queryKeys.customFields(cfBuilderRole));
    } catch (err: any) {
      alert('Gagal menghapus field: ' + err.message);
    }
  };

  const openEditUser = async (user: any) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserNis(user.nis || '');
    setEditUserIsActive(user.isActive);
    // pre-fill custom field values
    const existingVals: Record<string, string> = {};
    (user.customFieldValues || []).forEach((cfv: any) => {
      existingVals[String(cfv.fieldId)] = cfv.value;
    });
    setEditUserCustomFields(existingVals);
    // ensure custom fields for this role are loaded
    await qc.refetchQueries({ queryKey: queryKeys.customFields(user.role) });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditUserSaving(true);
    try {
      await api.updateAdminUser(editingUser.id, {
        name: editUserName,
        email: editUserEmail,
        nis: editingUser.role === 'student' ? editUserNis : undefined,
        isActive: editUserIsActive,
        customFields: editUserCustomFields,
      });
      alert('Data pengguna berhasil diperbarui!');
      setShowEditUserModal(false);
      setEditingUser(null);
      invalidate(queryKeys.adminUsers);
    } catch (err: any) {
      alert('Gagal memperbarui pengguna: ' + err.message);
    } finally {
      setEditUserSaving(false);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`Hapus akun "${user.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.deleteAdminUser(user.id);
      alert('Pengguna berhasil dihapus.');
      invalidate(queryKeys.adminUsers, queryKeys.adminSummary);
    } catch (err: any) {
      alert('Gagal menghapus pengguna: ' + err.message);
    }
  };

  const handleOpenLevelModal = (level: any | null = null) => {
    setSelectedLevelForEdit(level);
    if (level) {
      setLevelFormName(level.name);
      const parsed = level.juzList.split(',').map((j: string) => parseInt(j.trim())).filter((j: number) => !isNaN(j));
      setLevelFormJuzList(parsed);
      setLevelFormTargetDays(level.targetDays);
    } else {
      setLevelFormName('');
      setLevelFormJuzList([]);
      setLevelFormTargetDays(30);
    }
    setShowLevelModal(true);
  };

  const handleJuzCheckboxChange = (j: number) => {
    setLevelFormJuzList(prev => {
      if (prev.includes(j)) {
        return prev.filter(item => item !== j);
      } else {
        return [...prev, j].sort((a, b) => a - b);
      }
    });
  };

  const handleCreateOrUpdateLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelFormName.trim()) {
      alert('Nama level wajib diisi.');
      return;
    }
    if (levelFormJuzList.length === 0) {
      alert('Pilih minimal satu Juz untuk level ini.');
      return;
    }

    const juzListStr = levelFormJuzList.join(',');
    setLevelSaving(true);

    const levelData = {
      name: levelFormName,
      juzCount: levelFormJuzList.length,
      juzList: juzListStr,
      targetDays: levelFormTargetDays
    };

    const promise = selectedLevelForEdit
      ? api.updateAdminLevel(selectedLevelForEdit.id, levelData)
      : api.createAdminLevel(levelData);

    promise
      .then(() => {
        alert(selectedLevelForEdit ? 'Level berhasil diperbarui!' : 'Level baru berhasil ditambahkan!');
        setShowLevelModal(false);
        invalidate(queryKeys.adminLevels, queryKeys.adminUsers);
      })
      .catch((err) => {
        alert('Gagal menyimpan level: ' + err.message);
      })
      .finally(() => {
        setLevelSaving(false);
      });
  };

  const handleDeleteLevel = (id: number) => {
    if (window.confirm('Yakin ingin menghapus level ini? Data level pada santri yang terhubung akan dikosongkan.')) {
      api.deleteAdminLevel(id)
        .then(() => {
          alert('Level berhasil dihapus!');
          invalidate(queryKeys.adminLevels, queryKeys.adminUsers);
        })
        .catch((err) => {
          alert('Gagal menghapus level: ' + err.message);
        });
    }
  };

  const handleAssignStudentLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignStudentId) {
      alert('Pilih santri terlebih dahulu.');
      return;
    }
    setAssignLoading(true);
    api.assignStudentLevel(parseInt(assignStudentId), assignLevelId ? parseInt(assignLevelId) : null)
      .then(() => {
        alert('Level santri berhasil diperbarui!');
        setAssignStudentId('');
        setAssignLevelId('');
        invalidate(queryKeys.adminLevels, queryKeys.adminUsers);
      })
      .catch((err) => {
        alert('Gagal memperbarui level santri: ' + err.message);
      })
      .finally(() => {
        setAssignLoading(false);
      });
  };

  const handleLinkParent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkStudentId || !linkParentId) {
      alert('Pilih santri dan orang tua terlebih dahulu.');
      return;
    }
    api.linkParentStudent(parseInt(linkStudentId), parseInt(linkParentId), linkRelationship)
      .then(() => {
        alert('Hubungan Orang Tua & Santri berhasil disimpan!');
        setLinkStudentId('');
        setLinkParentId('');
        invalidate(queryKeys.linkedParents);
      })
      .catch((err) => {
        alert('Gagal menghubungkan: ' + err.message);
      });
  };

  const parseCsvAndImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCsvText.trim()) {
      alert('Teks CSV masih kosong.');
      return;
    }
    setImporting(true);
    setImportErrors([]);
    setImportSuccessCount(null);

    const lines = importCsvText.split('\n');
    const users: any[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',').map(s => s.trim());
      if (parts[0].toLowerCase() === 'nama' || parts[0].toLowerCase() === 'name') {
        continue; // skip header
      }
      
      users.push({
        name: parts[0],
        email: parts[1],
        role: parts[2],
        nis: parts[3] || undefined
      });
    }

    if (users.length === 0) {
      alert('Tidak ada baris data yang ditemukan dalam input.');
      setImporting(false);
      return;
    }

    api.createAdminUsersBulk(users)
      .then((res: any) => {
        setImportSuccessCount(res.successCount);
        setImportErrors(res.errors || []);
        if (res.successCount > 0) {
          invalidate(queryKeys.adminUsers, queryKeys.adminSummary);
          setImportCsvText('');
          alert(`Sukses menambahkan ${res.successCount} pengguna!`);
        }
      })
      .catch((err) => {
        alert('Gagal memproses bulk import: ' + err.message);
      })
      .finally(() => {
        setImporting(false);
      });
  };

  const handleAssignStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHalaqahForMembers || !newMemberStudentId) return;

    setMemberLoading(true);
    api.assignStudentToHalaqah(selectedHalaqahForMembers.id, parseInt(newMemberStudentId))
      .then((assigned) => {
        alert('Santri berhasil ditambahkan ke halaqah!');
        invalidate(queryKeys.adminHalaqahs);
        setSelectedHalaqahForMembers((prev: any) => ({
          ...prev,
          students: [...prev.students, assigned]
        }));
        setNewMemberStudentId('');
      })
      .catch((err) => {
        alert('Gagal menambahkan anggota: ' + err.message);
      })
      .finally(() => {
        setMemberLoading(false);
      });
  };

  const handleRemoveStudent = (studentId: number) => {
    if (!selectedHalaqahForMembers) return;
    if (!window.confirm('Yakin ingin mengeluarkan santri ini dari halaqah?')) return;

    setMemberLoading(true);
    api.removeStudentFromHalaqah(selectedHalaqahForMembers.id, studentId)
      .then(() => {
        alert('Santri dikeluarkan dari halaqah.');
        invalidate(queryKeys.adminHalaqahs);
        setSelectedHalaqahForMembers((prev: any) => ({
          ...prev,
          students: prev.students.filter((s: any) => s.studentId !== studentId)
        }));
      })
      .catch((err) => {
        alert('Gagal mengeluarkan anggota: ' + err.message);
      })
      .finally(() => {
        setMemberLoading(false);
      });
  };

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  const handleUpdateConfig = (e: React.FormEvent) => {
    e.preventDefault();
    api.updateAdminConfig({
      scoreInitial,
      penaltyJali,
      penaltyKhafi,
      penaltyTark,
      passThreshold,
    })
      .then(() => {
        alert('Konfigurasi penilaian berhasil diperbarui!');
      })
      .catch((err) => {
        alert('Gagal memperbarui konfigurasi: ' + err.message);
      });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    api.createAdminUser({
      name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole,
      nis: newUserRole === 'student' ? newUserNis : undefined,
      ...(Object.keys(newUserCustomFields).length > 0 ? { customFields: newUserCustomFields } : {}),
    } as any)
      .then(() => {
        alert('Pengguna baru berhasil ditambahkan!');
        setShowUserModal(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('password123');
        setNewUserNis('');
        setNewUserCustomFields({});
        invalidate(queryKeys.adminUsers, queryKeys.adminSummary);
      })
      .catch((err) => {
        alert('Gagal menambahkan pengguna: ' + err.message);
      });
  };

  const handleCreateHalaqah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHalaqahUstadzId) {
      alert('Pilih ustadz terlebih dahulu.');
      return;
    }

    api.createAdminHalaqah({
      name: newHalaqahName,
      ustadzId: parseInt(newHalaqahUstadzId),
      description: newHalaqahDesc,
    })
      .then(() => {
        alert('Halaqah baru berhasil ditambahkan!');
        setShowHalaqahModal(false);
        setNewHalaqahName('');
        setNewHalaqahUstadzId('');
        setNewHalaqahDesc('');
        invalidate(queryKeys.adminHalaqahs, queryKeys.adminSummary);
      })
      .catch((err) => {
        alert('Gagal menambahkan halaqah: ' + err.message);
      });
  };

  const ustadzList = usersList.filter((u: any) => u.role === 'ustadz');

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col lg:flex-row">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-150 flex items-center justify-between px-6 py-4 sticky top-0 z-30 lg:hidden shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-gray-50 rounded-xl transition-all"
            title="Buka Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            {appLogo ? (
              <img src={appLogo} alt={appName} className="h-8 w-auto object-contain rounded-lg" />
            ) : (
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-black text-base shadow-sm shadow-emerald-200">
                {appName.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="font-extrabold text-gray-900 text-base leading-tight flex items-center gap-1.5">
              {appName}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <NotificationCenter />
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-gray-50 transition-all"
            title="Keluar"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Navigation Sidebar (Desktop: Fixed, Mobile: Drawer) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 bg-gradient-to-b from-emerald-900 to-emerald-950 text-emerald-100 flex flex-col justify-between z-50 transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:z-20 shadow-xl lg:shadow-none",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isSidebarCollapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        <div className={cn(
          "flex flex-col h-full justify-between transition-all duration-300",
          isSidebarCollapsed ? "p-4" : "p-6"
        )}>
          <div>
            {/* Branding */}
            <div className={cn(
              "flex items-center justify-between mb-8 transition-all duration-300",
              isSidebarCollapsed ? "flex-col gap-4" : "flex-row"
            )}>
              <div className="flex items-center space-x-3 overflow-hidden">
                {appLogo ? (
                  <img src={appLogo} alt={appName} className="h-10 w-auto object-contain rounded-xl max-w-[80px] shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-white text-emerald-900 rounded-xl flex items-center justify-center font-black text-xl shadow-md flex-shrink-0">
                    {appName.charAt(0).toUpperCase()}
                  </div>
                )}
                {!isSidebarCollapsed && (
                  <div className="overflow-hidden animate-fadeIn">
                    <h1 className="font-extrabold text-white text-base leading-tight truncate">
                      {appName}
                    </h1>
                    <p className="text-[10px] text-emerald-300 font-bold tracking-wider uppercase truncate">INTEGRASI TALAQQI</p>
                  </div>
                )}
              </div>

              {/* Toggle expand/collapse for desktop */}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden lg:flex items-center justify-center bg-emerald-800/40 border border-emerald-700/30 hover:bg-emerald-800/80 text-emerald-100 hover:text-white p-1.5 rounded-xl transition-all cursor-pointer shrink-0"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              {/* Close button for mobile drawer */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800/40 rounded-lg lg:hidden"
                title="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile widget */}
            <div className={cn(
              "bg-emerald-800/40 border border-emerald-700/30 rounded-2xl mb-8 flex items-center transition-all duration-300",
              isSidebarCollapsed ? "justify-center p-2.5" : "space-x-3 p-4"
            )}>
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center border-2 border-emerald-505 shadow-sm flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden animate-fadeIn">
                  <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                  <p className="text-xs text-emerald-300 font-medium">Administrator</p>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <nav className="space-y-2">
              <button
                onClick={() => { setActiveTab('summary'); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center rounded-xl font-bold text-sm transition-all duration-200 text-left",
                  isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-start space-x-3 px-4 py-3",
                  activeTab === 'summary'
                    ? "bg-white text-emerald-950 shadow-md"
                    : "text-emerald-100 hover:bg-emerald-800/40 hover:text-white"
                )}
                title={isSidebarCollapsed ? "Ringkasan Lembaga" : undefined}
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="animate-fadeIn">Ringkasan Lembaga</span>}
              </button>

              <button
                onClick={() => { setActiveTab('config'); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center rounded-xl font-bold text-sm transition-all duration-200 text-left",
                  isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-start space-x-3 px-4 py-3",
                  activeTab === 'config'
                    ? "bg-white text-emerald-950 shadow-md"
                    : "text-emerald-100 hover:bg-emerald-800/40 hover:text-white"
                )}
                title={isSidebarCollapsed ? "Konfigurasi Penilaian" : undefined}
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="animate-fadeIn">Konfigurasi Penilaian</span>}
              </button>

              <button
                onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center rounded-xl font-bold text-sm transition-all duration-200 text-left",
                  isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-start space-x-3 px-4 py-3",
                  activeTab === 'users'
                    ? "bg-white text-emerald-950 shadow-md"
                    : "text-emerald-100 hover:bg-emerald-800/40 hover:text-white"
                )}
                title={isSidebarCollapsed ? "Manajemen Pengguna" : undefined}
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="animate-fadeIn">Manajemen Pengguna</span>}
              </button>

              <button
                onClick={() => { setActiveTab('levels'); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center rounded-xl font-bold text-sm transition-all duration-200 text-left",
                  isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-start space-x-3 px-4 py-3",
                  activeTab === 'levels'
                    ? "bg-white text-emerald-950 shadow-md"
                    : "text-emerald-100 hover:bg-emerald-800/40 hover:text-white"
                )}
                title={isSidebarCollapsed ? "Level & Target Hafalan" : undefined}
              >
                <Award className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="animate-fadeIn">Level & Target Hafalan</span>}
              </button>

              <button
                onClick={() => { setActiveTab('halaqah'); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center rounded-xl font-bold text-sm transition-all duration-200 text-left",
                  isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-start space-x-3 px-4 py-3",
                  activeTab === 'halaqah'
                    ? "bg-white text-emerald-950 shadow-md"
                    : "text-emerald-100 hover:bg-emerald-800/40 hover:text-white"
                )}
                title={isSidebarCollapsed ? "Daftar Halaqah" : undefined}
              >
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="animate-fadeIn">Daftar Halaqah</span>}
              </button>

              <button
                onClick={() => { setActiveTab('whitelabel'); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center rounded-xl font-bold text-sm transition-all duration-200 text-left",
                  isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-start space-x-3 px-4 py-3",
                  activeTab === 'whitelabel'
                    ? "bg-white text-emerald-950 shadow-md"
                    : "text-emerald-100 hover:bg-emerald-800/40 hover:text-white"
                )}
                title={isSidebarCollapsed ? "White Label Branding" : undefined}
              >
                <Shield className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="animate-fadeIn">White Label Branding</span>}
              </button>

              <button
                onClick={() => { setActiveTab('academic'); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center rounded-xl font-bold text-sm transition-all duration-200 text-left",
                  isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-start space-x-3 px-4 py-3",
                  activeTab === 'academic'
                    ? "bg-white text-emerald-950 shadow-md"
                    : "text-emerald-100 hover:bg-emerald-800/40 hover:text-white"
                )}
                title={isSidebarCollapsed ? "Tahun Pelajaran & Kelas" : undefined}
              >
                <Calendar className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="animate-fadeIn">Tahun Pelajaran & Kelas</span>}
              </button>

              <button
                onClick={() => { setActiveTab('documentation'); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center rounded-xl font-bold text-sm transition-all duration-200 text-left",
                  isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-start space-x-3 px-4 py-3",
                  activeTab === 'documentation'
                    ? "bg-white text-emerald-950 shadow-md"
                    : "text-emerald-100 hover:bg-emerald-800/40 hover:text-white"
                )}
                title={isSidebarCollapsed ? "Dokumentasi & Kegiatan" : undefined}
              >
                <Camera className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="animate-fadeIn">Dokumentasi & Kegiatan</span>}
              </button>
            </nav>
          </div>

          {/* Logout at bottom */}
          <div className="pt-6 border-t border-emerald-800/50 mt-auto">
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center rounded-xl font-bold text-sm text-red-250 hover:bg-red-950/40 hover:text-red-100 transition-all duration-200 cursor-pointer",
                isSidebarCollapsed ? "justify-center w-10 h-10 px-0 mx-auto" : "justify-start space-x-3 px-4 py-3 w-full"
              )}
              title={isSidebarCollapsed ? "Keluar Sistem" : undefined}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="animate-fadeIn">Keluar Sistem</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Working Panel */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Desktop Header */}
        <header className="hidden lg:flex bg-white border-b border-gray-100 h-16 items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div>
            <h2 className="font-extrabold text-gray-900 text-lg">
              {activeTab === 'summary' && 'Ringkasan Lembaga'}
              {activeTab === 'config' && 'Konfigurasi Penilaian'}
              {activeTab === 'users' && 'Manajemen Pengguna'}
              {activeTab === 'halaqah' && 'Daftar Halaqah'}
              {activeTab === 'whitelabel' && 'White Label Branding'}
              {activeTab === 'levels' && 'Level & Target Hafalan'}
              {activeTab === 'academic' && 'Tahun Pelajaran & Kelas'}
              {activeTab === 'documentation' && 'Dokumentasi & Kegiatan SITA'}
            </h2>
            <p className="text-xs text-gray-400 font-medium">Dashboard Administrasi Utama {appName}</p>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationCenter />
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-right">
              <p className="text-sm font-bold text-gray-800">{user?.name}</p>
              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Lembaga Admin</p>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1">
          {/* Tab: Summary */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-gray-800">
                    Ahlan wa Sahlan, {user?.name}! 👋
                  </h3>
                  <p className="text-sm text-gray-400 font-medium mt-1">
                    Berikut adalah rangkuman aktivitas, performa talaqqi, dan statistik santri secara real-time.
                  </p>
                </div>
                <div className="text-xs md:text-sm font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-2xl self-start md:self-center">
                  Hari Ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Stats Aggregations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Students */}
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-extrabold text-gray-900 leading-tight">
                      {summaryStats?.studentCount ?? 0}
                    </h4>
                    <p className="text-xs text-gray-450 font-bold uppercase tracking-wider mt-0.5">Total Santri</p>
                  </div>
                </div>

                {/* Teachers */}
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex items-center space-x-4">
                  <div className="w-12 h-12 bg-teal-50 text-teal-650 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-extrabold text-gray-900 leading-tight">
                      {summaryStats?.ustadzCount ?? 0}
                    </h4>
                    <p className="text-xs text-gray-455 font-bold uppercase tracking-wider mt-0.5">Total Ustadz</p>
                  </div>
                </div>

                {/* Halaqahs */}
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-extrabold text-gray-900 leading-tight">
                      {summaryStats?.halaqahCount ?? 0}
                    </h4>
                    <p className="text-xs text-gray-455 font-bold uppercase tracking-wider mt-0.5">Halaqah Aktif</p>
                  </div>
                </div>

                {/* Parents */}
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-extrabold text-gray-900 leading-tight">
                      {summaryStats?.parentCount ?? 0}
                    </h4>
                    <p className="text-xs text-gray-455 font-bold uppercase tracking-wider mt-0.5">Wali Terkoneksi</p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Average Score Gauge/Card */}
                <div className="bg-white border border-gray-155 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
                  <h4 className="text-base font-extrabold text-gray-800 mb-6">Performa Rata-rata Talaqqi</h4>
                  <div className="flex flex-col sm:flex-row items-center sm:space-x-8 gap-4">
                    <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                      {/* SVG gauge decoration */}
                      <svg className="absolute w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" stroke="#F3F4F6" strokeWidth="8" fill="transparent" />
                        <circle
                          cx="56" cy="56" r="48" stroke="#10B981" strokeWidth="8" fill="transparent"
                          strokeDasharray={2 * Math.PI * 48}
                          strokeDashoffset={2 * Math.PI * 48 * (1 - (summaryStats?.averageScore ?? 0) / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="text-center">
                        <span className="text-3xl font-black text-gray-800">{summaryStats?.averageScore ?? 0}</span>
                        <span className="text-xs text-gray-400 block font-medium">/100</span>
                      </div>
                    </div>
                    <div className="text-center sm:text-left space-y-2">
                      <p className="text-sm font-semibold text-gray-700">Skor Rata-rata Kumulatif</p>
                      <p className="text-xs text-gray-400 leading-relaxed font-medium">
                        Diperoleh dari agregasi seluruh nilai ujian setoran baru dan murajaah yang disubmit oleh Asatidzah.
                      </p>
                      <div className="pt-2">
                        <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-xl">
                          Sangat Baik (Batas Lulus: {passThreshold})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pass Rate Gauge/Card */}
                <div className="bg-white border border-gray-155 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
                  <h4 className="text-base font-extrabold text-gray-800 mb-6">Persentase Kelulusan Sesi</h4>
                  <div className="flex flex-col sm:flex-row items-center sm:space-x-8 gap-4">
                    <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                      {/* SVG gauge decoration */}
                      <svg className="absolute w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" stroke="#F3F4F6" strokeWidth="8" fill="transparent" />
                        <circle
                          cx="56" cy="56" r="48" stroke="#3B82F6" strokeWidth="8" fill="transparent"
                          strokeDasharray={2 * Math.PI * 48}
                          strokeDashoffset={2 * Math.PI * 48 * (1 - (summaryStats?.passRate ?? 0) / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="text-center">
                        <span className="text-3xl font-black text-gray-800">{summaryStats?.passRate ?? 0}%</span>
                        <span className="text-xs text-gray-400 block font-medium">Lulus</span>
                      </div>
                    </div>
                    <div className="text-center sm:text-left space-y-2">
                      <p className="text-sm font-semibold text-gray-700">Rasio Ketuntasan Talaqqi</p>
                      <p className="text-xs text-gray-400 leading-relaxed font-medium">
                        Persentase sesi talaqqi dengan status "Lulus" setelah evaluasi penalti kesalahan tajwid (Jali, Khafi, Tark).
                      </p>
                      <div className="pt-2">
                        <span className="bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1 rounded-xl">
                          Total Sesi: {summaryStats?.totalSessions ?? 0} Selesai
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Institution Quick Commands & Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick actions panel */}
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-base font-extrabold text-gray-850 mb-1">Aksi Cepat Admin</h4>
                    <p className="text-xs text-gray-400 font-medium mb-6">Pintasan praktis untuk mengelola operasional tahfidz.</p>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => { setActiveTab('users'); setUserSubTab('masterdata'); setShowUserModal(true); }}
                        className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-emerald-50/50 hover:text-emerald-900 border border-gray-100 rounded-2xl text-left text-xs font-bold text-gray-700 transition-all"
                      >
                        <span>Tambah Pengguna Baru</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => { setActiveTab('halaqah'); setShowHalaqahModal(true); }}
                        className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-emerald-50/50 hover:text-emerald-900 border border-gray-100 rounded-2xl text-left text-xs font-bold text-gray-700 transition-all"
                      >
                        <span>Buat Halaqah Baru</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => { setActiveTab('users'); setUserSubTab('import'); }}
                        className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-emerald-50/50 hover:text-emerald-900 border border-gray-100 rounded-2xl text-left text-xs font-bold text-gray-700 transition-all"
                      >
                        <span>Bulk Import Akun via CSV</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => { setActiveTab('config'); }}
                        className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-emerald-50/50 hover:text-emerald-900 border border-gray-100 rounded-2xl text-left text-xs font-bold text-gray-700 transition-all"
                      >
                        <span>Atur Parameter Penilaian</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Halaqah overview summary list */}
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-extrabold text-gray-850">Grup Halaqah Aktif</h4>
                      <p className="text-xs text-gray-400 font-medium">Daftar beberapa halaqah terdaftar saat ini.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('halaqah')}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all"
                    >
                      Lihat Semua ({halaqahList.length})
                    </button>
                  </div>

                  <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto pr-1">
                    {halaqahList.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-8">Belum ada halaqah terdaftar.</p>
                    ) : (
                      halaqahList.map((h: any) => (
                        <div key={h.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                          <div>
                            <p className="text-sm font-bold text-gray-800">{h.name}</p>
                            <p className="text-xs text-gray-400 font-medium">
                              Ustadz: <span className="text-gray-650 font-semibold">{h.ustadz?.name || 'Belum di-assign'}</span>
                            </p>
                          </div>
                          <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                            {h.students?.length || 0} Santri
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Config */}
          {activeTab === 'config' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-xl">
            <h2 className="text-xl font-extrabold text-gray-800 mb-2">Konfigurasi Penilaian</h2>
            <p className="text-sm text-gray-400 font-medium mb-6">
              Parameter penilaian default yang digunakan oleh sistem talaqqi.
            </p>

            <form onSubmit={handleUpdateConfig} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Skor Awal</label>
                <input
                  type="number"
                  required
                  value={scoreInitial}
                  onChange={(e) => setScoreInitial(parseInt(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Penalti Jali</label>
                  <input
                    type="number"
                    required
                    value={penaltyJali}
                    onChange={(e) => setPenaltyJali(parseInt(e.target.value))}
                    className="w-full bg-red-50 border border-red-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white text-red-700 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Penalti Khafi</label>
                  <input
                    type="number"
                    required
                    value={penaltyKhafi}
                    onChange={(e) => setPenaltyKhafi(parseInt(e.target.value))}
                    className="w-full bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-orange-700 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Penalti Tark</label>
                  <input
                    type="number"
                    required
                    value={penaltyTark}
                    onChange={(e) => setPenaltyTark(parseInt(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white text-gray-700 font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Batas Nilai Lulus</label>
                <input
                  type="number"
                  required
                  value={passThreshold}
                  onChange={(e) => setPassThreshold(parseInt(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800 font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-4 font-bold text-lg transition-all shadow-md shadow-emerald-100 mt-2"
              >
                Simpan Konfigurasi
              </button>
            </form>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Primary Sub-Tab Navigation */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100 px-6 pt-4 gap-1">
                {([
                  { id: 'masterdata', label: 'Master Data Pengguna', icon: <Database className="w-3.5 h-3.5" /> },
                  { id: 'link',       label: 'Hubungkan Wali',       icon: <Users className="w-3.5 h-3.5" /> },
                  { id: 'import',     label: 'Bulk Import CSV',       icon: <Plus className="w-3.5 h-3.5" /> },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setUserSubTab(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 pb-3 px-3 font-bold text-xs border-b-2 transition-all',
                      userSubTab === tab.id
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    )}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* ── MASTER DATA SUB-PANEL ── */}
              {userSubTab === 'masterdata' && (
                <div className="p-6">
                  {/* Role Tabs */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex gap-2 bg-gray-100 rounded-2xl p-1">
                      {([
                        { id: 'student', label: 'Data Santri',   color: 'blue'    },
                        { id: 'ustadz',  label: 'Data Ustadz',   color: 'emerald' },
                        { id: 'parent',  label: 'Data Wali',     color: 'purple'  },
                      ] as const).map(rt => (
                        <button
                          key={rt.id}
                          onClick={() => {
                            setMasterDataRoleTab(rt.id);
                            // custom fields auto-loaded by TanStack Query hooks
                          }}
                          className={cn(
                            'px-4 py-2 rounded-xl text-xs font-bold transition-all',
                            masterDataRoleTab === rt.id
                              ? rt.id === 'student'  ? 'bg-blue-600 text-white shadow-sm'
                              : rt.id === 'ustadz'   ? 'bg-emerald-600 text-white shadow-sm'
                              :                        'bg-purple-600 text-white shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                          )}
                        >
                          {rt.label} ({usersList.filter((u: any) => u.role === rt.id).length})
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openCfBuilder(masterDataRoleTab)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-800 rounded-xl text-xs font-bold transition-all"
                      >
                        <Wrench className="w-3.5 h-3.5" /> Kelola Field Kustom
                      </button>
                      <button
                        onClick={() => {
                          setNewUserRole(masterDataRoleTab);
                          // custom fields auto-loaded by TanStack Query hooks
                          setShowUserModal(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah {masterDataRoleTab === 'student' ? 'Santri' : masterDataRoleTab === 'ustadz' ? 'Ustadz' : 'Wali'}
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Table */}
                  {(() => {
                    const roleUsers = usersList.filter((u: any) => u.role === masterDataRoleTab);
                    const roleCfs   = customFields[masterDataRoleTab] || [];

                    return (
                      <div className="overflow-x-auto rounded-2xl border border-gray-100">
                        <table className="w-full border-collapse text-left text-sm min-w-[600px]">
                          <thead>
                            <tr className="bg-gray-50 text-gray-500 font-bold text-xs">
                              <th className="py-3 px-4 rounded-tl-2xl">Nama</th>
                              <th className="py-3 px-4">Email</th>
                              {masterDataRoleTab === 'student' && <th className="py-3 px-4">NIS</th>}
                              {roleCfs.map((cf: any) => (
                                <th key={cf.id} className="py-3 px-4">{cf.fieldName}{cf.isRequired ? ' *' : ''}</th>
                              ))}
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4 text-right rounded-tr-2xl">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-gray-700">
                            {roleUsers.length === 0 ? (
                              <tr>
                                <td colSpan={5 + roleCfs.length} className="py-12 text-center text-gray-400 italic text-sm">
                                  Belum ada data {masterDataRoleTab === 'student' ? 'santri' : masterDataRoleTab === 'ustadz' ? 'ustadz' : 'wali'} terdaftar.
                                </td>
                              </tr>
                            ) : (
                              roleUsers.map((u: any) => {
                                const cfValMap: Record<string, string> = {};
                                (u.customFieldValues || []).forEach((cfv: any) => {
                                  cfValMap[String(cfv.fieldId)] = cfv.value;
                                });

                                return (
                                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-3.5 px-4 font-bold text-gray-900">
                                      <div className="flex items-center gap-2.5">
                                        <div className={cn(
                                          'w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs flex-shrink-0',
                                          masterDataRoleTab === 'student' ? 'bg-blue-100 text-blue-700'
                                          : masterDataRoleTab === 'ustadz' ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-purple-100 text-purple-700'
                                        )}>
                                          {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        {u.name}
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-gray-500">{u.email}</td>
                                    {masterDataRoleTab === 'student' && (
                                      <td className="py-3.5 px-4">
                                        <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg">{u.nis || '-'}</span>
                                      </td>
                                    )}
                                    {roleCfs.map((cf: any) => (
                                      <td key={cf.id} className="py-3.5 px-4 text-gray-600 text-xs">
                                        {cfValMap[String(cf.id)] || <span className="text-gray-300 italic">–</span>}
                                      </td>
                                    ))}
                                    <td className="py-3.5 px-4">
                                      <span className={cn(
                                        'inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full',
                                        u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                                      )}>
                                        <span className={cn('w-1.5 h-1.5 rounded-full', u.isActive ? 'bg-emerald-500' : 'bg-red-400')} />
                                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          onClick={() => openEditUser(u)}
                                          title="Edit"
                                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteUser(u)}
                                          title="Hapus"
                                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ── LINK WALI SUB-PANEL ── */}
              {userSubTab === 'link' && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-1 border-r border-gray-100 pr-0 md:pr-8">
                    <h3 className="text-sm font-bold text-gray-800 mb-4">Hubungkan Wali</h3>
                    <form onSubmit={handleLinkParent} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Santri</label>
                        <select
                          value={linkStudentId}
                          onChange={(e) => setLinkStudentId(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        >
                          <option value="">Pilih Santri</option>
                          {usersList.filter((u: any) => u.role === 'student').map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name} (NIS: {s.nis})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Orang Tua / Wali</label>
                        <select
                          value={linkParentId}
                          onChange={(e) => setLinkParentId(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        >
                          <option value="">Pilih Orang Tua</option>
                          {usersList.filter((u: any) => u.role === 'parent').map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hubungan</label>
                        <select
                          value={linkRelationship}
                          onChange={(e) => setLinkRelationship(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        >
                          <option value="ayah">Ayah</option>
                          <option value="ibu">Ibu</option>
                          <option value="wali">Wali / Lainnya</option>
                        </select>
                      </div>
                      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 font-bold text-xs transition-all shadow-sm">
                        Simpan Hubungan
                      </button>
                    </form>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-bold text-gray-800 mb-4">Daftar Relasi Santri &amp; Orang Tua</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-400 font-bold">
                            <th className="py-2.5 px-3">Santri</th>
                            <th className="py-2.5 px-3">NIS</th>
                            <th className="py-2.5 px-3">Orang Tua / Wali</th>
                            <th className="py-2.5 px-3">Hubungan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                          {linkedParents.length === 0 ? (
                            <tr><td colSpan={4} className="py-4 text-center text-gray-400">Belum ada hubungan terdaftar</td></tr>
                          ) : (
                            linkedParents.map((l: any) => (
                              <tr key={l.id}>
                                <td className="py-2.5 px-3 font-bold text-gray-900">{l.student?.name}</td>
                                <td className="py-2.5 px-3">{l.student?.nis}</td>
                                <td className="py-2.5 px-3">{l.parent?.name} ({l.parent?.email})</td>
                                <td className="py-2.5 px-3">
                                  <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">{l.relationship}</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── IMPORT CSV SUB-PANEL ── */}
              {userSubTab === 'import' && (
                <div className="p-6 max-w-2xl">
                  <h3 className="text-sm font-bold text-gray-800 mb-1">Bulk Import Akun via CSV</h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Salin dan tempel data CSV. Password akun baru akan di-set default ke <code className="bg-gray-100 px-1 rounded font-mono">password123</code>.
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4 text-xs font-mono text-gray-600">
                    <span className="font-bold text-emerald-800">Format Baris:</span> nama, email, role, nis(khusus santri)<br />
                    <span className="font-bold text-emerald-800">Contoh:</span><br />
                    Ahmad Dhani, ahmad@sita.id, student, 12346<br />
                    Ustadz Lukman, lukman@sita.id, ustadz<br />
                    Wali Ahmad, wali@sita.id, parent
                  </div>
                  <form onSubmit={parseCsvAndImport} className="space-y-4">
                    <textarea
                      rows={8}
                      value={importCsvText}
                      onChange={(e) => setImportCsvText(e.target.value)}
                      placeholder="nama, email, role, nis..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800"
                    />
                    {importSuccessCount !== null && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 font-bold">Berhasil menambahkan {importSuccessCount} pengguna!</div>
                    )}
                    {importErrors.length > 0 && (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-800 font-bold space-y-1">
                        <p className="underline">Daftar Error Baris:</p>
                        {importErrors.map((err, idx) => <p key={idx}>• {err}</p>)}
                      </div>
                    )}
                    <button type="submit" disabled={importing} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-2.5 font-bold text-xs transition-all shadow-sm disabled:opacity-50">
                      {importing ? 'Memproses Import...' : 'Import Data Pengguna'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}


        {activeTab === 'halaqah' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800">Daftar Halaqah</h2>
                <p className="text-xs text-gray-400 font-medium mt-1">Daftar kelompok talaqqi dan guru pengampu.</p>
              </div>
              <button
                onClick={() => setShowHalaqahModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl flex items-center shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Tambah Halaqah
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold">
                    <th className="py-3 px-4">Nama Halaqah</th>
                    <th className="py-3 px-4">Ustadz Pengampu</th>
                    <th className="py-3 px-4">Deskripsi</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                  {halaqahList.map((h: any) => (
                    <tr key={h.id}>
                      <td className="py-3.5 px-4 font-bold text-gray-900">{h.name}</td>
                      <td className="py-3.5 px-4">{h.ustadz?.name || 'Belum di-assign'}</td>
                      <td className="py-3.5 px-4">{h.description || '-'}</td>
                      <td className="py-3.5 px-4">
                        <span className={cn('text-xs font-bold', h.isActive ? 'text-emerald-600' : 'text-red-500')}>
                          {h.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setSelectedHalaqahForMembers(h)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200 transition-all cursor-pointer"
                        >
                          Kelola Anggota ({h.students?.length || 0})
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'whitelabel' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-gray-800">Pengaturan White Label Branding</h2>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Kustomisasi nama, logo, dan identitas visual aplikasi untuk branding instansi Anda.
              </p>
            </div>

            <form onSubmit={handleSaveWhiteLabel} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Text Configs */}
                <div className="space-y-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Informasi Instansi</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Aplikasi / Lembaga</label>
                    <input
                      type="text"
                      required
                      value={wlAppName}
                      onChange={(e) => setWlAppName(e.target.value)}
                      placeholder="Contoh: SITA Tahfidz"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800 text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teks Footer (Slogan / Hak Cipta)</label>
                    <input
                      type="text"
                      required
                      value={wlFooterText}
                      onChange={(e) => setWlFooterText(e.target.value)}
                      placeholder="Contoh: Sistem Digital Setoran Tahfidz"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800 text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-6 flex flex-col justify-center">
                  <h4 className="font-extrabold text-emerald-900 text-sm mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-emerald-600" />
                    Panduan Branding White Label
                  </h4>
                  <ul className="text-xs text-emerald-800 font-medium space-y-2 list-disc list-inside">
                    <li>Nama Aplikasi menggantikan seluruh nama "SITA" di dashboard dan judul halaman browser.</li>
                    <li>Logo Dashboard akan tampil di bagian atas menu navigasi samping kiri.</li>
                    <li>Logo Login akan digunakan di tengah form halaman masuk utama.</li>
                    <li>Gunakan logo berformat PNG transparan atau SVG dengan ukuran maksimal 1MB agar tampilan tetap optimal.</li>
                  </ul>
                </div>
              </div>

              {/* Logo Files */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
                {/* Logo Dashboard */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Logo Dashboard & Sidebar</h3>
                  <div className="border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 transition-all relative min-h-[160px]">
                    {wlAppLogo ? (
                      <div className="text-center space-y-4">
                        <img src={wlAppLogo} alt="Logo Dashboard Preview" className="max-h-20 max-w-full object-contain mx-auto rounded-xl p-2 bg-emerald-950/20" />
                        <button
                          type="button"
                          onClick={() => setWlAppLogo(null)}
                          className="text-xs font-bold text-red-500 hover:text-red-700 px-3 py-1.5 bg-red-50 rounded-xl hover:bg-red-100 transition-all"
                        >
                          Hapus Logo
                        </button>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 mx-auto shadow-sm">
                          <Plus className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-700">Pilih berkas Logo Dashboard</p>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Maks. 1MB (Format PNG, JPG, atau SVG)</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLogoUpload(e, 'app')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Logo Login */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Logo Layar Login</h3>
                  <div className="border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 transition-all relative min-h-[160px]">
                    {wlLoginLogo ? (
                      <div className="text-center space-y-4">
                        <img src={wlLoginLogo} alt="Logo Login Preview" className="max-h-20 max-w-full object-contain mx-auto rounded-xl p-2 bg-gray-100" />
                        <button
                          type="button"
                          onClick={() => setWlLoginLogo(null)}
                          className="text-xs font-bold text-red-500 hover:text-red-700 px-3 py-1.5 bg-red-50 rounded-xl hover:bg-red-100 transition-all"
                        >
                          Hapus Logo
                        </button>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 mx-auto shadow-sm">
                          <Plus className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-700">Pilih berkas Logo Login</p>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Maks. 1MB (Format PNG, JPG, atau SVG)</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLogoUpload(e, 'login')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Action */}
              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={wlSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-emerald-100 transition-all disabled:opacity-50 flex items-center text-sm"
                >
                  {wlSaving ? 'Menyimpan...' : 'Simpan Kustomisasi Branding'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'levels' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Split layout: Levels list (left) & Assign Student (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Level List Panel */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-800">Level Hafalan Dinamis</h2>
                    <p className="text-xs text-gray-400 font-medium mt-1">Daftar level kemampuan dan parameter target hafalan santri.</p>
                  </div>
                  <button
                    onClick={() => handleOpenLevelModal(null)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl flex items-center shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Tambah Level
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold">
                        <th className="py-3 px-4">Nama Level</th>
                        <th className="py-3 px-4 text-center">Jumlah Juz</th>
                        <th className="py-3 px-4">Daftar Nomor Juz</th>
                        <th className="py-3 px-4 text-center">Target Waktu</th>
                        <th className="py-3 px-4 text-center">Jumlah Santri</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                      {levelsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400 italic">Belum ada level terdaftar. Silakan tambahkan level baru.</td>
                        </tr>
                      ) : (
                        levelsList.map((lvl: any) => (
                          <tr key={lvl.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-gray-900">{lvl.name}</td>
                            <td className="py-3.5 px-4 text-center font-bold">{lvl.juzCount} Juz</td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1">
                                {lvl.juzList.split(',').map((j: string) => (
                                  <span key={j} className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-100">
                                    Juz {j}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-xs">
                                {lvl.targetDays} Hari
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold">
                              {lvl.students?.length || 0} Santri
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-2">
                              <button
                                onClick={() => handleOpenLevelModal(lvl)}
                                className="text-xs font-bold text-emerald-700 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteLevel(lvl.id)}
                                className="text-xs font-bold text-red-500 hover:underline"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Assign Student Panel */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-800">Assign Level Santri</h3>
                  <p className="text-xs text-gray-400 font-medium mt-1">Hubungkan santri ke level target hafalan yang sesuai.</p>
                </div>

                <form onSubmit={handleAssignStudentLevel} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pilih Santri</label>
                    <select
                      value={assignStudentId}
                      onChange={(e) => setAssignStudentId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800 cursor-pointer"
                    >
                      <option value="">Pilih Santri</option>
                      {usersList
                        .filter((u: any) => u.role === 'student' && u.isActive)
                        .map((s: any) => {
                          const currentLevel = levelsList.find((l: any) => l.id === s.levelId);
                          return (
                            <option key={s.id} value={s.id}>
                              {s.name} (NIS: {s.nis}) {currentLevel ? `[${currentLevel.name}]` : '[Belum ada level]'}
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Level Target Hafalan</label>
                    <select
                      value={assignLevelId}
                      onChange={(e) => setAssignLevelId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800 cursor-pointer"
                    >
                      <option value="">Tanpa Level (Reset)</option>
                      {levelsList.map((lvl: any) => (
                        <option key={lvl.id} value={lvl.id}>
                          {lvl.name} ({lvl.juzCount} Juz | {lvl.targetDays} Hari)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={assignLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold text-sm transition-all shadow-sm disabled:opacity-50"
                  >
                    {assignLoading ? 'Menyimpan...' : 'Simpan Penempatan Level'}
                  </button>
                </form>
              </div>
            </div>

            {/* Level Creator/Editor Modal */}
            {showLevelModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 border border-gray-100 max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-6">
                    {selectedLevelForEdit ? 'Edit Level Hafalan' : 'Tambah Level Hafalan Baru'}
                  </h3>
                  
                  <form onSubmit={handleCreateOrUpdateLevel} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Level</label>
                      <input
                        type="text"
                        required
                        value={levelFormName}
                        onChange={(e) => setLevelFormName(e.target.value)}
                        placeholder="Contoh: Level 1 - Juz 30"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800 font-semibold text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Waktu Menghafal (Hari)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={levelFormTargetDays}
                        onChange={(e) => setLevelFormTargetDays(parseInt(e.target.value) || 30)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800 font-semibold text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Daftar Nomor Juz ({levelFormJuzList.length} terpilih)</label>
                      <div className="grid grid-cols-5 gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-4 max-h-48 overflow-y-auto">
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                          <label key={j} className="flex items-center space-x-1.5 p-1 hover:bg-gray-100 rounded cursor-pointer text-xs font-bold text-gray-700">
                            <input
                              type="checkbox"
                              checked={levelFormJuzList.includes(j)}
                              onChange={() => handleJuzCheckboxChange(j)}
                              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                            />
                            <span>Juz {j}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4 border-t border-gray-100">
                      <button
                        type="submit"
                        disabled={levelSaving}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl shadow-sm transition-all text-sm disabled:opacity-50"
                      >
                        {levelSaving ? 'Menyimpan...' : 'Simpan Level'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLevelModal(false)}
                        className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-3 rounded-2xl transition-all text-sm"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
           </div>
         )}

         {/* ═══════════ Tab: Tahun Pelajaran & Kelas ═══════════ */}
         {activeTab === 'academic' && (
           <div className="space-y-8 animate-fadeIn">
             {/* Header Banner */}
             <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 md:p-8 text-white shadow-lg">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div>
                   <h3 className="text-xl md:text-2xl font-black">📅 Tahun Pelajaran & Kelas</h3>
                   <p className="text-indigo-100 text-sm mt-1 font-medium">
                     Kelola tahun pelajaran aktif dan daftar kelas beserta anggotanya.
                   </p>
                 </div>
                 <div className="flex gap-3 flex-wrap">
                   <button
                     onClick={() => setShowAcademicYearModal(true)}
                     className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all"
                   >
                     <Plus className="w-4 h-4" /> Tahun Pelajaran
                   </button>
                   <button
                     onClick={() => setShowClassroomModal(true)}
                     className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm"
                   >
                     <School className="w-4 h-4" /> Tambah Kelas
                   </button>
                 </div>
               </div>
             </div>

             {/* Tahun Pelajaran Cards */}
             <div>
               <h4 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-4">Daftar Tahun Pelajaran</h4>
               {(academicYears as any[]).length === 0 ? (
                 <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
                   <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                   <p className="text-sm font-bold text-gray-500">Belum ada tahun pelajaran</p>
                   <p className="text-xs text-gray-400 mt-1">Klik tombol "Tahun Pelajaran" di atas untuk menambahkan.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   {(academicYears as any[]).map((year: any) => (
                     <div key={year.id} className={cn(
                       "bg-white rounded-3xl border p-6 shadow-sm hover:shadow-md transition-all cursor-pointer",
                       year.isActive ? "border-indigo-300 ring-2 ring-indigo-200" : "border-gray-100",
                       selectedAcademicYearId === year.id && "ring-2 ring-emerald-300 border-emerald-200"
                     )} onClick={() => setSelectedAcademicYearId(selectedAcademicYearId === year.id ? undefined : year.id)}>
                       <div className="flex items-start justify-between mb-3">
                         <div>
                           <p className="text-base font-extrabold text-gray-900">{year.name}</p>
                           <p className="text-xs text-gray-400 mt-0.5 font-medium">
                             {year.isActive ? '✅ Tahun Pelajaran Aktif' : 'Tidak Aktif'}
                           </p>
                         </div>
                         {year.isActive && (
                           <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2 py-1 rounded-lg uppercase">Aktif</span>
                         )}
                       </div>
                       <div className="flex gap-2 mt-4">
                         {!year.isActive && (
                           <button
                             onClick={(e) => { e.stopPropagation(); handleSetActiveAcademicYear(year.id); }}
                             className="flex-1 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 rounded-xl transition-all"
                           >
                             Aktifkan
                           </button>
                         )}
                         <button
                           onClick={(e) => { e.stopPropagation(); handleDeleteAcademicYear(year.id); }}
                           className="text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl transition-all"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>

             {/* Filter by Academic Year */}
             {(academicYears as any[]).length > 0 && (
               <div className="flex items-center gap-3 flex-wrap">
                 <span className="text-sm font-bold text-gray-500">Filter Kelas:</span>
                 <button
                   onClick={() => setSelectedAcademicYearId(undefined)}
                   className={cn("text-xs font-bold px-3 py-1.5 rounded-xl transition-all border",
                     selectedAcademicYearId === undefined
                       ? "bg-gray-800 text-white border-gray-800"
                       : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                   )}
                 >
                   Semua
                 </button>
                 {(academicYears as any[]).map((y: any) => (
                    <button key={y.id}
                      onClick={() => setSelectedAcademicYearId(y.id)}
                      className={cn("text-xs font-bold px-3 py-1.5 rounded-xl transition-all border",
                        selectedAcademicYearId === y.id
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {y.name}
                    </button>
                  ))}
               </div>
             )}

             {/* Daftar Kelas */}
             <div>
               <h4 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-4">
                 Daftar Kelas {selectedAcademicYearId
                   ? `— ${(academicYears as any[]).find((y: any) => y.id === selectedAcademicYearId)?.name}`
                   : '(Semua)'}
               </h4>
               {(classrooms as any[]).length === 0 ? (
                 <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
                   <School className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                   <p className="text-sm font-bold text-gray-500">Belum ada kelas</p>
                   <p className="text-xs text-gray-400 mt-1">Klik "Tambah Kelas" untuk menambahkan kelas baru.</p>
                 </div>
               ) : (
                 <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                   <table className="w-full border-collapse text-left text-sm">
                     <thead>
                       <tr className="border-b border-gray-100 text-gray-400 font-bold text-xs uppercase tracking-wider">
                         <th className="py-4 px-6 w-10"></th>
                         <th className="py-4 px-6">Nama Kelas</th>
                         <th className="py-4 px-6">Tahun Pelajaran</th>
                         <th className="py-4 px-6 text-center">Jumlah Sub-Kelas</th>
                         <th className="py-4 px-6 text-right">Aksi</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                       {(classrooms as any[]).map((cls: any) => {
                         const isExpanded = expandedClassroomId === cls.id;
                         return (
                           <React.Fragment key={cls.id}>
                             {/* Parent Classroom Row */}
                             <tr className="hover:bg-gray-50/40 transition-colors">
                               <td className="py-4 px-6">
                                 <button
                                   onClick={() => setExpandedClassroomId(isExpanded ? null : cls.id)}
                                   className="text-gray-400 hover:text-indigo-600 transition-all p-1 hover:bg-gray-100 rounded-lg"
                                 >
                                   <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isExpanded ? "rotate-180" : "")} />
                                 </button>
                               </td>
                               <td className="py-4 px-6">
                                 <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                     <School className="w-4 h-4 text-indigo-600" />
                                   </div>
                                   <span className="font-bold text-gray-900">{cls.name}</span>
                                 </div>
                               </td>
                               <td className="py-4 px-6">
                                 <span className={cn(
                                   "text-xs font-bold px-2.5 py-1 rounded-lg",
                                   cls.academicYear?.isActive ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-500"
                                 )}>
                                   {cls.academicYear?.name}{cls.academicYear?.isActive && ' ✓'}
                                 </span>
                               </td>
                               <td className="py-4 px-6 text-center">
                                 <span className="bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-lg text-xs">
                                   {cls._count?.subClassrooms ?? 0} Sub-Kelas
                                 </span>
                               </td>
                               <td className="py-4 px-6">
                                 <div className="flex justify-end gap-2">
                                   <button
                                     onClick={() => handleOpenCreateSubClassroom(cls)}
                                     className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-all"
                                   >
                                     + Sub-Kelas
                                   </button>
                                   <button
                                     onClick={() => handleDeleteClassroom(cls.id)}
                                     className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-all"
                                   >
                                     <Trash2 className="w-3.5 h-3.5" />
                                   </button>
                                 </div>
                               </td>
                             </tr>

                             {/* Expanded SubClassrooms list */}
                             {isExpanded && (
                               <tr>
                                 <td colSpan={5} className="bg-gray-50/50 p-6 border-b border-gray-100">
                                   <div className="pl-12 space-y-4">
                                     <div className="flex justify-between items-center mb-2">
                                       <h5 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Sub-Kelas di {cls.name}</h5>
                                     </div>
                                      <SubClassroomList classroomId={cls.id} />
                                   </div>
                                 </td>
                               </tr>
                             )}
                           </React.Fragment>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
          </div>
        )}

          {/* ═══════════ Tab: Dokumentasi & Kegiatan SITA ═══════════ */}
          {activeTab === 'documentation' && (
            <div className="space-y-8 animate-fadeIn text-left">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-3xl p-6 md:p-8 text-white shadow-lg flex items-center justify-between">
                <div>
                  <h3 className="text-xl md:text-2xl font-black">Dokumentasi & Kegiatan SITA</h3>
                  <p className="text-emerald-100 text-xs md:text-sm mt-1 max-w-xl font-medium">
                    Kelola foto dokumentasi kegiatan pesantren. Foto yang diunggah akan otomatis tampil di Photo Slider pada dashboard Orangtua dan Santri.
                  </p>
                </div>
                <div className="hidden md:flex w-16 h-16 bg-white/10 rounded-2xl items-center justify-center backdrop-blur-xs border border-white/20">
                  <Camera className="w-8 h-8 text-emerald-100 animate-pulse" />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Form Upload */}
                <div className="xl:col-span-1 bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
                  <div>
                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider">Unggah Dokumentasi Baru</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Unggah foto kegiatan terbaru berformat Landscape.</p>
                  </div>

                  <form onSubmit={handleSaveDocumentation} className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Judul Kegiatan</label>
                      <input
                        type="text"
                        required
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="Contoh: Keceriaan Ujian Juziyah Santri SITA"
                        className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Kategori / Tag (Opsional)</label>
                      <input
                        type="text"
                        value={docTag}
                        onChange={(e) => setDocTag(e.target.value)}
                        placeholder="Contoh: Halaqah Sore, Wisuda, Ujian"
                        className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Pilih Foto</label>
                      <div className="relative group border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl p-4 transition-all bg-gray-50/50 hover:bg-emerald-50/10 text-center cursor-pointer flex flex-col items-center justify-center min-h-48">
                        <input
                          id="doc-file-input"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUploadChange}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        {docImage ? (
                          <div className="w-full h-full space-y-3">
                            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-gray-250 bg-slate-900">
                              <img src={docImage} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDocImage(null);
                                  const fileInput = document.getElementById('doc-file-input') as HTMLInputElement;
                                  if (fileInput) fileInput.value = '';
                                }}
                                className="absolute top-2 right-2 bg-red-605 text-white p-1.5 rounded-full hover:bg-red-700 transition-all z-20 cursor-pointer border-0 shadow-md"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium">Klik atau seret file lain untuk mengganti</p>
                          </div>
                        ) : (
                          <div className="space-y-2 py-4">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                              <Camera className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-700">Klik untuk memilih foto</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">Format JPG/PNG/WEBP, Maksimal 2.5MB</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={docSaving || !docImage}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer border-0"
                    >
                      {docSaving ? 'Mengunggah...' : 'Unggah Dokumentasi'}
                    </button>
                  </form>
                </div>

                {/* Grid List Foto */}
                <div className="xl:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
                  <div>
                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider">Koleksi Dokumentasi Kegiatan</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Daftar foto yang saat ini aktif di slider dashboard orangtua & santri.</p>
                  </div>

                  {isLoadingPhotos ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-xs font-semibold">Memuat galeri foto...</p>
                    </div>
                  ) : uploadedPhotos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50/50 rounded-2xl border border-gray-155 border-dashed p-6">
                      <div className="w-12 h-12 bg-gray-100 text-gray-450 rounded-2xl flex items-center justify-center mb-3">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-extrabold text-gray-700">Belum Ada Dokumentasi Mandiri</p>
                      <p className="text-[11px] text-gray-400 mt-1 max-w-sm">
                        Saat ini dashboard menampilkan slide bawaan sistem. Mulailah mengunggah foto kegiatan pesantren agar tampil lebih personal!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {uploadedPhotos.map((photo: any) => (
                        <div
                          key={photo.id}
                          className="group relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all bg-slate-900 text-left"
                        >
                          <img
                            src={photo.imageUrl}
                            alt={photo.title}
                            className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.02]"
                          />
                          {/* Overlay Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-955 via-slate-950/20 to-transparent p-4 flex flex-col justify-end">
                            {photo.tag && (
                              <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 w-fit mb-1 shadow-sm uppercase tracking-wider">
                                {photo.tag}
                              </span>
                            )}
                            <p className="text-xs font-black text-white leading-tight drop-shadow-md truncate max-w-[80%]">
                              {photo.title}
                            </p>
                          </div>
                          {/* Hover Action Button */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => handleDeleteDocumentation(photo.id)}
                              className="p-2 bg-red-600/90 text-white rounded-xl hover:bg-red-650 shadow-md transition-all cursor-pointer backdrop-blur-xs border-0"
                              title="Hapus Dokumentasi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
      </main>

      {/* ═══ Tahun Pelajaran Modal ═══ */}
      {showAcademicYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-gray-900">Tambah Tahun Pelajaran</h3>
              <button onClick={() => setShowAcademicYearModal(false)} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-xl transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateAcademicYear} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Tahun Pelajaran</label>
                <input
                  type="text"
                  required
                  value={newAcademicYearName}
                  onChange={(e) => setNewAcademicYearName(e.target.value)}
                  placeholder="Contoh: 2025/2026"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-gray-800 font-semibold text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createAcademicYear.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl shadow-sm transition-all disabled:opacity-50 text-sm">
                  {createAcademicYear.isPending ? 'Menyimpan...' : 'Simpan Tahun Pelajaran'}
                </button>
                <button type="button" onClick={() => setShowAcademicYearModal(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-3 rounded-2xl transition-all text-sm">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Tambah Kelas Modal ═══ */}
      {showClassroomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-gray-900">Tambah Kelas Baru</h3>
              <button onClick={() => setShowClassroomModal(false)} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-xl transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateClassroom} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Kelas</label>
                <input
                  type="text"
                  required
                  value={newClassroomName}
                  onChange={(e) => setNewClassroomName(e.target.value)}
                  placeholder="Contoh: Kelas 10-A, Kelas VII-B"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-gray-800 font-semibold text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tahun Pelajaran</label>
                <select
                  required
                  value={newClassroomAcademicYearId}
                  onChange={(e) => setNewClassroomAcademicYearId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-gray-800 font-semibold text-sm cursor-pointer"
                >
                  <option value="">Pilih Tahun Pelajaran</option>
                  {(academicYears as any[]).map((y: any) => (
                    <option key={y.id} value={y.id}>
                      {y.name}{y.isActive ? ' (Aktif)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createClassroom.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl shadow-sm transition-all disabled:opacity-50 text-sm">
                  {createClassroom.isPending ? 'Menyimpan...' : 'Simpan Kelas'}
                </button>
                <button type="button" onClick={() => setShowClassroomModal(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-3 rounded-2xl transition-all text-sm">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Tambah Sub-Kelas Modal ═══ */}
      {showSubClassroomModal && selectedClassroomForSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Tambah Sub-Kelas</h3>
                <p className="text-xs text-gray-400 mt-1">Kelas Induk: <span className="font-bold text-gray-800">{selectedClassroomForSub.name}</span></p>
              </div>
              <button onClick={() => setShowSubClassroomModal(false)} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-xl transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubClassroom} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Sub-Kelas</label>
                <input
                  type="text"
                  required
                  value={newSubClassroomName}
                  onChange={(e) => setNewSubClassroomName(e.target.value)}
                  placeholder="Contoh: A, B, Tahfidz-1"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-gray-800 font-semibold text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createSubClassroom.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl shadow-sm transition-all disabled:opacity-50 text-sm">
                  {createSubClassroom.isPending ? 'Menyimpan...' : 'Simpan Sub-Kelas'}
                </button>
                <button type="button" onClick={() => setShowSubClassroomModal(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-3 rounded-2xl transition-all text-sm">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Kelola Anggota Sub-Kelas Modal ═══ */}
      {showSubClassroomMembersModal && selectedSubClassroomForMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-8 border border-gray-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Kelola Anggota Sub-Kelas</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Sub-Kelas: <span className="font-bold text-gray-800">{selectedSubClassroomForMembers.name}</span>
                </p>
              </div>
              <button
                onClick={() => { setShowSubClassroomMembersModal(false); setSelectedSubClassroomForMembers(null); }}
                className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Add student form */}
              <div className="border-r border-gray-100 pr-0 md:pr-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Tambah Santri ke Sub-Kelas</h4>
                <form onSubmit={handleAssignStudentToSubClassroom} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pilih Santri</label>
                    <select
                      value={newSubClassroomMemberStudentId}
                      onChange={(e) => setNewSubClassroomMemberStudentId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                    >
                      <option value="">Pilih Santri</option>
                      {(usersList as any[])
                        .filter((u: any) => u.role === 'student' && !(subClassroomMembersList as any[]).some((m: any) => m.id === u.id))
                        .map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name} (NIS: {s.nis})</option>
                        ))
                      }
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={assignStudentsToSubClassroom.isPending || !newSubClassroomMemberStudentId}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 font-bold text-xs transition-all shadow-sm disabled:opacity-50"
                  >
                    {assignStudentsToSubClassroom.isPending ? 'Memproses...' : 'Tambahkan ke Sub-Kelas'}
                  </button>
                </form>
              </div>

              {/* Current members */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Anggota Saat Ini ({(subClassroomMembersList as any[]).length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {(subClassroomMembersList as any[]).length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-6">Belum ada anggota dalam sub-kelas ini.</p>
                  ) : (
                    (subClassroomMembersList as any[]).map((student: any) => (
                      <div key={student.id} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-150 rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{student.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">NIS: {student.nis}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStudentFromSubClassroom(student.id)}
                          disabled={removeStudentFromSubClassroom.isPending}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Kelola Anggota Kelas Modal ═══ */}
      {showClassroomMembersModal && selectedClassroomForMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-8 border border-gray-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Kelola Anggota Kelas</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Kelas: <span className="font-bold text-gray-800">{selectedClassroomForMembers.name}</span>
                  {' | '} Tahun: <span className="font-bold text-indigo-600">{selectedClassroomForMembers.academicYear?.name}</span>
                </p>
              </div>
              <button
                onClick={() => { setShowClassroomMembersModal(false); setSelectedClassroomForMembers(null); }}
                className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Add student form */}
              <div className="border-r border-gray-100 pr-0 md:pr-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Tambah Santri ke Kelas</h4>
                <form onSubmit={handleAssignStudentToClassroom} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pilih Santri</label>
                    <select
                      value={newClassroomMemberStudentId}
                      onChange={(e) => setNewClassroomMemberStudentId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                    >
                      <option value="">Pilih Santri</option>
                      {(usersList as any[])
                        .filter((u: any) => u.role === 'student' && !(classroomMembersList as any[]).some((m: any) => m.id === u.id))
                        .map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name} (NIS: {s.nis})</option>
                        ))
                      }
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={assignStudentsToClassroom.isPending || !newClassroomMemberStudentId}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 font-bold text-xs transition-all shadow-sm disabled:opacity-50"
                  >
                    {assignStudentsToClassroom.isPending ? 'Memproses...' : 'Tambahkan ke Kelas'}
                  </button>
                </form>
              </div>

              {/* Current members */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Anggota Saat Ini ({(classroomMembersList as any[]).length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {(classroomMembersList as any[]).length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-6">Belum ada anggota dalam kelas ini.</p>
                  ) : (
                    (classroomMembersList as any[]).map((student: any) => (
                      <div key={student.id} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-150 rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{student.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">NIS: {student.nis}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStudentFromClassroom(student.id)}
                          disabled={removeStudentFromClassroom.isPending}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        >
                          Keluarkan
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 border border-gray-100">
            <h3 className="text-xl font-extrabold text-gray-900 mb-6">Tambah Pengguna Baru</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Peran (Role)</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800"
                >
                  <option value="student">Santri / Siswa</option>
                  <option value="ustadz">Ustadz / Pengajar</option>
                  <option value="parent">Orang Tua / Wali</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {newUserRole === 'student' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">NIS (Nomor Induk Santri)</label>
                  <input
                    type="text"
                    required
                    value={newUserNis}
                    onChange={(e) => setNewUserNis(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800"
                  />
                </div>
              )}

              {/* Dynamic Custom Fields for new user */}
              {(['student', 'ustadz', 'parent'] as const).includes(newUserRole as any) && (customFields[newUserRole as 'student' | 'ustadz' | 'parent'] || []).map((cf: any) => (
                <div key={cf.id}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {cf.fieldName}{cf.isRequired ? ' *' : ''}
                    <span className="ml-2 text-[10px] font-normal text-gray-400 uppercase tracking-wider">{cf.fieldType}</span>
                  </label>
                  {cf.fieldType === 'select' ? (
                    <select
                      value={newUserCustomFields[String(cf.id)] || ''}
                      onChange={(e) => setNewUserCustomFields(prev => ({ ...prev, [String(cf.id)]: e.target.value }))}
                      required={cf.isRequired}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800 text-sm"
                    >
                      <option value="">Pilih...</option>
                      {(cf.options || '').split(',').map((opt: string) => opt.trim()).filter(Boolean).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={cf.fieldType === 'number' ? 'number' : cf.fieldType === 'date' ? 'date' : 'text'}
                      value={newUserCustomFields[String(cf.id)] || ''}
                      onChange={(e) => setNewUserCustomFields(prev => ({ ...prev, [String(cf.id)]: e.target.value }))}
                      required={cf.isRequired}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800 text-sm"
                    />
                  )}
                </div>
              ))}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl shadow-sm transition-all"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-3 rounded-2xl transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Halaqah Modal */}
      {showHalaqahModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 border border-gray-100">
            <h3 className="text-xl font-extrabold text-gray-900 mb-6">Tambah Halaqah Baru</h3>
            <form onSubmit={handleCreateHalaqah} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Halaqah</label>
                <input
                  type="text"
                  required
                  value={newHalaqahName}
                  onChange={(e) => setNewHalaqahName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ustadz Pengampu</label>
                <select
                  value={newHalaqahUstadzId}
                  onChange={(e) => setNewHalaqahUstadzId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800"
                >
                  <option value="">Pilih Ustadz</option>
                  {ustadzList.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi</label>
                <textarea
                  value={newHalaqahDesc}
                  onChange={(e) => setNewHalaqahDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800 h-20"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl shadow-sm transition-all"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setShowHalaqahModal(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-3 rounded-2xl transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Halaqah Members Management Modal */}
      {selectedHalaqahForMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-8 border border-gray-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Kelola Anggota Halaqah</h3>
                <p className="text-xs text-gray-400 mt-1">Halaqah: <span className="font-bold text-gray-800">{selectedHalaqahForMembers.name}</span> | Pengampu: <span className="font-bold text-gray-800">{selectedHalaqahForMembers.ustadz?.name}</span></p>
              </div>
              <button
                onClick={() => setSelectedHalaqahForMembers(null)}
                className="text-gray-400 hover:text-gray-650 font-bold text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left column: Add student form */}
              <div className="border-r border-gray-100 pr-0 md:pr-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Tambahkan Anggota Baru</h4>
                <form onSubmit={handleAssignStudent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pilih Santri</label>
                    <select
                      value={newMemberStudentId}
                      onChange={(e) => setNewMemberStudentId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    >
                      <option value="">Pilih Santri</option>
                      {/* Filter students who are NOT already in this halaqah */}
                      {usersList
                        .filter((u: any) => u.role === 'student' && !selectedHalaqahForMembers.students?.some((s: any) => s.studentId === u.id))
                        .map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name} (NIS: {s.nis})</option>
                        ))
                      }
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={memberLoading || !newMemberStudentId}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 font-bold text-xs transition-all shadow-sm disabled:opacity-50"
                  >
                    {memberLoading ? 'Memproses...' : 'Tambahkan ke Halaqah'}
                  </button>
                </form>
              </div>

              {/* Right column: Current student list */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Anggota Halaqah Saat Ini</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {!selectedHalaqahForMembers.students || selectedHalaqahForMembers.students.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Belum ada anggota dalam halaqah ini.</p>
                  ) : (
                    selectedHalaqahForMembers.students.map((hs: any) => (
                      <div key={hs.id} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-150 rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{hs.student?.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">NIS: {hs.student?.nis}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(hs.studentId)}
                          disabled={memberLoading}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          title="Keluarkan dari Halaqah"
                        >
                          Keluarkan
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Edit User Modal ═══ */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="p-8 pb-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900">Edit Data Pengguna</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{editingUser.role.toUpperCase()} — {editingUser.email}</p>
                </div>
                <button onClick={() => setShowEditUserModal(false)} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-xl transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateUser} className="p-8 pt-0 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
                <input type="text" required value={editUserName} onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input type="email" required value={editUserEmail} onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 text-sm" />
              </div>
              {editingUser.role === 'student' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">NIS (Nomor Induk Santri)</label>
                  <input type="text" value={editUserNis} onChange={(e) => setEditUserNis(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 text-sm" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Status Aktif</label>
                <button type="button" onClick={() => setEditUserIsActive(!editUserIsActive)}
                  className={cn('relative inline-flex h-5 w-10 items-center rounded-full transition-colors', editUserIsActive ? 'bg-emerald-500' : 'bg-gray-300')}>
                  <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform', editUserIsActive ? 'translate-x-5' : 'translate-x-1')} />
                </button>
                <span className={cn('text-xs font-bold', editUserIsActive ? 'text-emerald-600' : 'text-gray-400')}>{editUserIsActive ? 'Aktif' : 'Nonaktif'}</span>
              </div>

              {/* Dynamic Custom Fields */}
              {(customFields[editingUser.role as 'student' | 'ustadz' | 'parent'] || []).length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Data Tambahan (Custom Fields)</p>
                  <div className="space-y-3">
                    {(customFields[editingUser.role as 'student' | 'ustadz' | 'parent'] || []).map((cf: any) => (
                      <div key={cf.id}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          {cf.fieldName}{cf.isRequired ? ' *' : ''}
                        </label>
                        {cf.fieldType === 'select' ? (
                          <select
                            value={editUserCustomFields[String(cf.id)] || ''}
                            onChange={(e) => setEditUserCustomFields(prev => ({ ...prev, [String(cf.id)]: e.target.value }))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="">Pilih...</option>
                            {(cf.options || '').split(',').map((opt: string) => opt.trim()).filter(Boolean).map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={cf.fieldType === 'number' ? 'number' : cf.fieldType === 'date' ? 'date' : 'text'}
                            value={editUserCustomFields[String(cf.id)] || ''}
                            onChange={(e) => setEditUserCustomFields(prev => ({ ...prev, [String(cf.id)]: e.target.value }))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="submit" disabled={editUserSaving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl shadow-sm transition-all disabled:opacity-50 text-sm">
                  {editUserSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button type="button" onClick={() => setShowEditUserModal(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-3 rounded-2xl transition-all text-sm">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Custom Field Builder Modal ═══ */}
      {showCfBuilderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="p-8 pb-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900">Kelola Field Kustom</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Peran: <span className={cn('font-bold uppercase px-1.5 py-0.5 rounded text-[11px]',
                      cfBuilderRole === 'student' ? 'bg-blue-50 text-blue-700'
                      : cfBuilderRole === 'ustadz' ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-purple-50 text-purple-700'
                    )}>{cfBuilderRole}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openCfForm(null)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all">
                    <Plus className="w-3.5 h-3.5" /> Tambah Field
                  </button>
                  <button onClick={() => setShowCfBuilderModal(false)}
                    className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-xl transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8 pt-4">
              {cfLoading ? (
                <div className="text-center py-10 text-gray-400 text-sm">Memuat field kustom...</div>
              ) : (customFields[cfBuilderRole] || []).length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                  <Database className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-500">Belum ada field kustom</p>
                  <p className="text-xs text-gray-400 mt-1">Klik "Tambah Field" untuk menambahkan kolom data baru.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(customFields[cfBuilderRole] || []).map((cf: any) => (
                    <div key={cf.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100/50 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white border border-gray-200 rounded-xl flex items-center justify-center">
                          <span className="text-[10px] font-extrabold text-gray-500 uppercase">{cf.fieldType.slice(0,3)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{cf.fieldName}{cf.isRequired && <span className="text-red-500 ml-1">*</span>}</p>
                          <p className="text-xs text-gray-400 capitalize">{cf.fieldType}{cf.options ? ` · ${cf.options}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openCfForm(cf)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteCf(cf.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Custom Field Form Modal ═══ */}
      {showCfFormModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 border border-gray-100">
            <h3 className="text-lg font-extrabold text-gray-900 mb-5">
              {cfFormEditing ? 'Edit Field Kustom' : 'Tambah Field Kustom Baru'}
            </h3>
            <form onSubmit={handleSaveCf} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Field</label>
                <input type="text" required value={cfFormName} onChange={(e) => setCfFormName(e.target.value)}
                  placeholder="Contoh: Nomor Telepon, Tanggal Lahir..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipe Data</label>
                <select value={cfFormType} onChange={(e) => setCfFormType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="text">Teks (text)</option>
                  <option value="number">Angka (number)</option>
                  <option value="date">Tanggal (date)</option>
                  <option value="select">Pilihan (dropdown select)</option>
                </select>
              </div>
              {cfFormType === 'select' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Opsi Pilihan (pisahkan dengan koma)</label>
                  <input type="text" value={cfFormOptions} onChange={(e) => setCfFormOptions(e.target.value)}
                    placeholder="Contoh: PNS, Swasta, Wirausaha"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setCfFormRequired(!cfFormRequired)}
                  className={cn('relative inline-flex h-5 w-10 items-center rounded-full transition-colors', cfFormRequired ? 'bg-emerald-500' : 'bg-gray-300')}>
                  <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform', cfFormRequired ? 'translate-x-5' : 'translate-x-1')} />
                </button>
                <label className="text-sm font-semibold text-gray-700">Field Wajib Diisi</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={cfFormSaving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50 text-sm">
                  {cfFormSaving ? 'Menyimpan...' : 'Simpan Field'}
                </button>
                <button type="button" onClick={() => setShowCfFormModal(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-2.5 rounded-xl transition-all text-sm">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SUB-CLASSROOMS EXPANDED VIEW COMPONENT ────────────────

interface SubClassroomListProps {
  classroomId: number;
}

const SubClassroomList: React.FC<SubClassroomListProps> = ({ classroomId }) => {
  const { data: subClassrooms = [], isLoading } = useSubClassrooms(classroomId);
  const deleteSubClassroom = useDeleteSubClassroom();

  // We borrow state handlers indirectly from context or define them in local layout if we need modals.
  // To avoid circular state dependencies, we trigger window.confirm for fast actions,
  // and we'll access the parent modals by custom event dispatching or rendering nested trigger buttons.
  // But wait, it's much cleaner if we dispatch a custom event or register a global click handler.
  // Let's implement active modal management using simple window event emitters so the sub-component can invoke parent's modal triggers.

  const triggerOpenMembers = (subClassroom: any) => {
    const event = new CustomEvent('open-subclassroom-members', { detail: subClassroom });
    window.dispatchEvent(event);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Hapus sub-kelas ini beserta semua data anggota di dalamnya?')) return;
    try {
      await deleteSubClassroom.mutateAsync({ id, classroomId });
    } catch (err: any) {
      alert('Gagal menghapus sub-kelas: ' + err.message);
    }
  };

  if (isLoading) {
    return <div className="text-xs text-gray-400 italic">Memuat sub-kelas...</div>;
  }

  if (subClassrooms.length === 0) {
    return (
      <div className="text-xs text-gray-400 italic bg-white rounded-2xl p-4 border border-gray-100 text-center">
        Belum ada sub-kelas. Klik tombol "+ Sub-Kelas" di kanan baris untuk menambahkan.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {subClassrooms.map((sub: any) => (
        <div key={sub.id} className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-50/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <School className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">{sub.name}</p>
              <p className="text-[10px] text-emerald-600 font-extrabold mt-0.5">{sub._count?.students ?? 0} Santri</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => triggerOpenMembers(sub)}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-all"
            >
              Kelola Santri
            </button>
            <button
              onClick={() => handleDelete(sub.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

