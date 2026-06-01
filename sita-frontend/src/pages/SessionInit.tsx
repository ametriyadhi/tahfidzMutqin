// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { Play, LogOut, BookOpen, AlertCircle, Save, XCircle, Menu, X, LayoutDashboard, Users, ChevronRight, ChevronLeft, History, Award, TrendingUp, Activity, Calendar, Search, BookMarked, Zap, MessageSquare, Send, Clock, CheckCircle2 } from 'lucide-react';
import { QuranReader } from '../components/QuranReader';
import { NotificationCenter } from '../components/NotificationCenter';
import { QURAN_PAGE_MAPPINGS, getPageForAyah } from '../lib/pageMappings';
import { useBranding } from '../context/BrandingContext';
import {
  useUstadzStudents,
  useSurahs,
  useAdminConfig,
  useSessions,
  useStudentProgress,
  useStudentHeatmap,
  useMessages,
  useSendMessage,
  useFinishSession,
  useRequestJuziyahExam,
  useUstadzHalaqahs,
  useAssignHomeMurajaah
} from '../hooks/useQueries';
import { LoadingFallback } from '../components/LoadingFallback';
import { MutabaahMurojaahReport } from '../components/MutabaahMurojaahReport';

const getJuzPageRange = (juz: number) => {
  if (juz === 1) return { start: 1, end: 21 };
  if (juz === 30) return { start: 582, end: 604 };
  
  const start = 22 + (juz - 2) * 20;
  const end = start + 19;
  return { start, end };
};


const getAllowedSurahIdsForJuzList = (allowedJuz: number[]): number[] => {
  const allowedSurahs = new Set<number>();
  allowedJuz.forEach(juz => {
    const range = getJuzPageRange(juz);
    for (let p = range.start; p <= range.end; p++) {
      const mappings = QURAN_PAGE_MAPPINGS[p];
      if (mappings) {
        mappings.forEach(m => {
          allowedSurahs.add(m.surahId);
        });
      }
    }
  });
  return Array.from(allowedSurahs).sort((a, b) => a - b);
};

const getSurahTotalAyahs = (surahId: number): number => {
  let maxAyah = 0;
  for (const ranges of Object.values(QURAN_PAGE_MAPPINGS)) {
    for (const range of ranges) {
      if (range.surahId === surahId) {
        if (range.endAyah > maxAyah) {
          maxAyah = range.endAyah;
        }
      }
    }
  }
  return maxAyah || 7; // Fallback to 7 (Al-Fatihah)
};

const getMappingForPageRange = (startP: number, endP: number) => {
  const startRanges = QURAN_PAGE_MAPPINGS[startP];
  const endRanges = QURAN_PAGE_MAPPINGS[endP];
  if (!startRanges || !endRanges) {
    return { surahId: 1, startAyah: 1, endAyah: 7, isFallback: true };
  }
  const first = startRanges[0];
  const last = endRanges[endRanges.length - 1];
  
  return {
    surahId: first.surahId,
    startAyah: first.startAyah,
    endAyah: last.surahId === first.surahId ? last.endAyah : first.endAyah,
    isFallback: false
  };
};

const SURAH_START_JUZ: Record<number, number> = {
  1: 1, 2: 1, 3: 3, 4: 4, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11,
  11: 11, 12: 12, 13: 13, 14: 13, 15: 14, 16: 14, 17: 15, 18: 15, 19: 16, 20: 16,
  21: 17, 22: 17, 23: 18, 24: 18, 25: 19, 26: 19, 27: 19, 28: 20, 29: 20, 30: 21,
  31: 21, 32: 21, 33: 21, 34: 22, 35: 22, 36: 22, 37: 23, 38: 23, 39: 23, 40: 24,
  41: 24, 42: 25, 43: 25, 44: 25, 45: 25, 46: 26, 47: 26, 48: 26, 49: 26, 50: 26,
  51: 26, 52: 27, 53: 27, 54: 27, 55: 27, 56: 27, 57: 27, 58: 28, 59: 28, 60: 28,
  61: 28, 62: 28, 63: 28, 64: 28, 65: 28, 66: 28, 67: 29, 68: 29, 69: 29, 70: 29,
  71: 29, 72: 29, 73: 29, 74: 29, 75: 29, 76: 29, 77: 29, 78: 30, 79: 30, 80: 30,
  81: 30, 82: 30, 83: 30, 84: 30, 85: 30, 86: 30, 87: 30, 88: 30, 89: 30, 90: 30,
  91: 30, 92: 30, 93: 30, 94: 30, 95: 30, 96: 30, 97: 30, 98: 30, 99: 30, 100: 30,
  101: 30, 102: 30, 103: 30, 104: 30, 105: 30, 106: 30, 107: 30, 108: 30, 109: 30, 110: 30,
  111: 30, 112: 30, 113: 30, 114: 30
};

const getJuzForPage = (page: number) => {
  if (page >= 1 && page <= 21) return 1;
  if (page >= 582 && page <= 604) return 30;
  return 2 + Math.floor((page - 22) / 20);
};

const getJuzForSession = (session: any) => {
  if (session.juzId !== null && session.juzId !== undefined) {
    return Number(session.juzId);
  }
  if (session.pageNumber) {
    return getJuzForPage(session.pageNumber);
  }
  if (session.startPage) {
    return getJuzForPage(session.startPage);
  }
  if (session.surahId) {
    return SURAH_START_JUZ[session.surahId] || 30;
  }
  return 30; // Fallback
};

const getPagesFromSession = (session: any) => {
  if (session.pageNumber) {
    return [Number(session.pageNumber)];
  }
  if (session.startPage && session.endPage) {
    const list: number[] = [];
    for (let p = Number(session.startPage); p <= Number(session.endPage); p++) {
      list.push(p);
    }
    return list;
  }
  return []; // Fallback for pure surah sessions with no pages
};

const getTotalPagesInJuz = (juz: number) => {
  if (juz === 1) return 21;
  if (juz === 30) return 23;
  return 20;
};

const JUZ_LABELS: Record<number, string> = {
  1: "Al-Baqarah", 2: "Sayaquul", 3: "Tilkal Rusul", 4: "Lan Tanaalu", 5: "Wal Muhshanat",
  6: "Laa Yuhibbullah", 7: "Wa Iza Sami'u", 8: "Wa Lau Annana", 9: "Qaalal Mala'u", 10: "Wa'lamu",
  11: "Ya'tazirun", 12: "Wa Maa Min Daabbatin", 13: "Wa Maa Ubarri'u", 14: "Alif Laam Ra", 15: "Subhanallazi",
  16: "Qaalal Alam", 17: "Iqtaraba Linnaas", 18: "Qad Aflaha", 19: "Wa Qaalal-Laziina", 20: "Aman Khalaqa",
  21: "Utlu Maa Uuhiya", 22: "Wa Man Yaqnut", 23: "Wa Maa Liya", 24: "Faman Azlamu", 25: "Ilaihi Yuraddu",
  26: "Haa Miim", 27: "Qaalal Famaa Khatbukum", 28: "Qad Sami'allah", 29: "Tabaarakallazi", 30: "Juz 'Amma"
};

export const SessionInit: React.FC = () => {
  const navigate = useNavigate();
  const user = api.getUser();
  const { appName, appLogo, setPageTitle } = useBranding();
  
  // UI Tabs
  const [activeTab, setActiveTab] = useState<'analytics' | 'talaqqi' | 'history' | 'tasmi' | 'ledger' | 'komunikasi' | 'home_murajaah'>('analytics');

  useEffect(() => {
    setPageTitle(
      activeTab === 'analytics' ? 'Dashboard Ustadz'
        : activeTab === 'talaqqi' ? 'Konsol Talaqqi'
        : activeTab === 'ledger' ? 'Ledger Nilai'
        : activeTab === 'history' ? "Mutaba'ah Santri"
        : activeTab === 'tasmi' ? "Mutaba'ah Tasmi'"
        : activeTab === 'komunikasi' ? "Buku Penghubung"
        : activeTab === 'home_murajaah' ? "Muraja'ah di Rumah"
        : 'Ledger Nilai'
    );
  }, [activeTab, appName]);
  // ═══ TanStack Query — data fetching with caching ═══
  const { data: students = [], isLoading: isStudentsLoading } = useUstadzStudents();
  const { data: surahs = [], isLoading: isSurahsLoading } = useSurahs();
  const { data: sessions = [], isLoading: isSessionsLoading } = useSessions();
  const { data: adminConfig, isLoading: isConfigLoading } = useAdminConfig();
  
  // Selection Mode: 'juz' | 'surah'
  const [selectionMode, setSelectionMode] = useState<'juz' | 'surah'>('juz');
  
  const [selectedFilterStudent, setSelectedFilterStudent] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [selectedReplayError, setSelectedReplayError] = useState<any | null>(null);
  const [logQuran, setLogQuran] = useState<any | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Configuration Form State
  const [selectedStudent, setSelectedStudent] = useState('');
  const [sessionType, setSessionType] = useState<'setoran_baru' | 'murajaah'>('setoran_baru');
  
  // Surah-based states
  const [selectedSurah, setSelectedSurah] = useState('');
  const [startAyah, setStartAyah] = useState('');
  const [endAyah, setEndAyah] = useState('');

  // Juz-based states
  const [juzId, setJuzId] = useState('');
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  
  // Student history & progression states
  const selectedStudentId = selectedStudent ? parseInt(selectedStudent) : 0;
  const { data: studentProgress } = useStudentProgress(selectedStudentId);
  const { data: studentHeatmap = [] } = useStudentHeatmap(selectedStudentId);
  const finishSessionMutation = useFinishSession();
  const requestJuziyahExamMutation = useRequestJuziyahExam();

  // ─── HOME MURAJAAH STATES ───────────────────────────
  const { data: halaqahs = [] } = useUstadzHalaqahs();
  const assignHomeMurajaahMutation = useAssignHomeMurajaah();
  
  const [homeAssignMode, setHomeAssignMode] = useState<'perorang' | 'perhalaqah'>('perorang');
  const [homeSelectedStudent, setHomeSelectedStudent] = useState('');
  const [homeSelectedHalaqah, setHomeSelectedHalaqah] = useState('');
  const [homeDate, setHomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [homeShift, setHomeShift] = useState('Subuh');
  const [homeTargetType, setHomeTargetType] = useState('Surat');
  
  // Multi-select dropdown states
  const [selectedHomeSurahs, setSelectedHomeSurahs] = useState<number[]>([]);
  const [selectedHomeJuzs, setSelectedHomeJuzs] = useState<number[]>([]);
  const [isSurahDropdownOpen, setIsSurahDropdownOpen] = useState(false);
  const [isJuzDropdownOpen, setIsJuzDropdownOpen] = useState(false);
  const [surahSearchText, setSurahSearchText] = useState('');

  const toggleHomeSurahSelection = (surahId: number) => {
    if (selectedHomeSurahs.includes(surahId)) {
      setSelectedHomeSurahs(prev => prev.filter(id => id !== surahId));
    } else {
      setSelectedHomeSurahs(prev => [...prev, surahId]);
    }
  };

  const toggleHomeJuzSelection = (juzNum: number) => {
    if (selectedHomeJuzs.includes(juzNum)) {
      setSelectedHomeJuzs(prev => prev.filter(n => n !== juzNum));
    } else {
      setSelectedHomeJuzs(prev => [...prev, juzNum]);
    }
  };

  const handleAssignHomeMurajaah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (homeAssignMode === 'perorang' && !homeSelectedStudent) {
      alert("Harap pilih santri terlebih dahulu.");
      return;
    }
    if (homeAssignMode === 'perhalaqah' && !homeSelectedHalaqah) {
      alert("Harap pilih halaqah terlebih dahulu.");
      return;
    }

    let calculatedTargetName = '';
    if (homeTargetType === 'Surat') {
      if (selectedHomeSurahs.length === 0) {
        alert("Harap pilih minimal satu surah.");
        return;
      }
      calculatedTargetName = selectedHomeSurahs
        .map(sid => surahs.find(s => s.id === sid)?.nameEn)
        .filter(Boolean)
        .join(', ');
    } else {
      if (selectedHomeJuzs.length === 0) {
        alert("Harap pilih minimal satu juz.");
        return;
      }
      calculatedTargetName = selectedHomeJuzs
        .map(j => `Juz ${j}`)
        .join(', ');
    }

    try {
      await assignHomeMurajaahMutation.mutateAsync({
        studentId: homeAssignMode === 'perorang' ? parseInt(homeSelectedStudent) : undefined,
        halaqahId: homeAssignMode === 'perhalaqah' ? parseInt(homeSelectedHalaqah) : undefined,
        assignedDate: homeDate,
        shift: homeShift,
        targetType: homeTargetType,
        targetName: calculatedTargetName
      });
      alert("Tugas muraja'ah rumah berhasil dikirim!");
      // Reset form
      setHomeSelectedStudent('');
      setHomeSelectedHalaqah('');
      setSelectedHomeSurahs([]);
      setSelectedHomeJuzs([]);
      setSurahSearchText('');
    } catch (err: any) {
      alert(err.message || "Gagal mengirim tugas muraja'ah rumah.");
    }
  };

  const handleRequestJuziyahExam = async (studentIdStr: string, juzNum: number) => {
    if (!window.confirm(`Apakah Anda yakin ingin mengajukan Ujian Juziyah Juz ${juzNum} untuk santri ini?`)) {
      return;
    }
    try {
      await requestJuziyahExamMutation.mutateAsync({
        studentId: Number(studentIdStr),
        juzId: juzNum
      });
      alert(`Ujian Juziyah Juz ${juzNum} berhasil diajukan ke Koordinator!`);
    } catch (err: any) {
      alert(err.message || 'Gagal mengajukan ujian juziyah');
    }
  };
  // Heatmap handled by TanStack query hook
  const [recommendation, setRecommendation] = useState('');
  const [prerequisiteAlert, setPrerequisiteAlert] = useState<string | null>(null);
  const [isPageSelectionLocked, setIsPageSelectionLocked] = useState(false);

  // Workstation State
  const scoringConfig = adminConfig || {
    scoreInitial: 100,
    penaltyJali: 3,
    penaltyKhafi: 1,
    penaltyTark: 2,
    passThreshold: 80,
  };
  const [activeSession, setActiveSession] = useState(false);
  const loading = isStudentsLoading || isSurahsLoading || isSessionsLoading || isConfigLoading;

  // ─── Calculate students ready for Juziyah exam ───
  const getStudentsReadyForExam = () => {
    const readyList: Array<{
      student: any;
      juz: number;
      completionPct: number;
      passedPagesCount: number;
      totalPages: number;
      hasPassedTasmi: boolean;
      examRequest: any;
    }> = [];

    students.forEach((student: any) => {
      const allowedJuzs = student.level?.juzList
        ? student.level.juzList.split(',').map((j: string) => parseInt(j.trim())).filter((j: number) => !isNaN(j))
        : [];
      
      const juzsToCheck = allowedJuzs.length > 0 ? allowedJuzs : Array.from({ length: 30 }, (_, i) => i + 1);

      juzsToCheck.forEach((juz: number) => {
        // Find passed pages (status = lulus, type = setoran_baru)
        const passedSessions = sessions.filter(
          (s: any) => s.studentId === student.id &&
                      getJuzForSession(s) === juz &&
                      s.status === 'lulus' &&
                      s.sessionType === 'setoran_baru'
        );

        const uniquePages = new Set<number>();
        passedSessions.forEach((s: any) => {
          getPagesFromSession(s).forEach((p: number) => uniquePages.add(p));
        });

        const totalPages = getTotalPagesInJuz(juz);
        const passedPagesCount = uniquePages.size;
        const completionPct = Math.min(100, Math.round((passedPagesCount / totalPages) * 100));

        // Check if student has passed Tasmi' Juz
        const allSessionsInJuz = sessions.filter(
          (s: any) => s.studentId === student.id && getJuzForSession(s) === juz
        );
        const hasPassedTasmi = allSessionsInJuz.some(
          (s: any) => s.status === 'lulus' && (s.sessionType === 'tasmi' || s.sessionType?.startsWith('tasmi_') || s.setoranScope === 'tasmi_juz')
        );

        if (completionPct === 100 && hasPassedTasmi) {
          const examRequest = student.examsAsStudent?.find((e: any) => e.juzId === juz);
          
          // Only include if no exam exists, or pending, or retake
          if (!examRequest || examRequest.status === 'pending' || examRequest.status === 'mengulang') {
            readyList.push({
              student,
              juz,
              completionPct,
              passedPagesCount,
              totalPages,
              hasPassedTasmi,
              examRequest
            });
          }
        }
      });
    });

    return readyList;
  };

  const readyForExams = getStudentsReadyForExam();
  const [score, setScore] = useState(100);
  const [sessionErrors, setSessionErrors] = useState<any[]>([]);
  const [notesUstadz, setNotesUstadz] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Quick-Log Mode State
  const [isQuickLogMode, setIsQuickLogMode] = useState(false);
  const [quickJaliCount, setQuickJaliCount] = useState(0);
  const [quickKhafiCount, setQuickKhafiCount] = useState(0);
  const [quickTarkCount, setQuickTarkCount] = useState(0);

  // Draft recovery states
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Komunikasi Module states
  const [chatStudentId, setChatStudentId] = useState<number | null>(null);
  const [historySubTab, setHistorySubTab] = useState<'setoran' | 'murajaah'>('setoran');
  const { data: messages = [] } = useMessages(chatStudentId || 0);
  const sendMessageMutation = useSendMessage();
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatStudentId) return;

    sendMessageMutation.mutateAsync({ studentId: chatStudentId, receiverId: null, content: newMessage })
      .then(() => {
        setNewMessage('');
      })
      .catch(err => {
        console.error(err);
        alert('Gagal mengirim pesan');
      });
  };
  const [draftToRecover, setDraftToRecover] = useState<any | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);

  const getJuzPagesList = () => {
    if (!startPage || !endPage) return [];
    const list: number[] = [];
    const startP = parseInt(startPage);
    const endP = parseInt(endPage);
    for (let p = startP; p <= endP; p++) {
      list.push(p);
    }
    return list;
  };

  const getPageScoresBreakdown = () => {
    if (selectionMode !== 'juz') return null;
    const pages = getJuzPagesList();
    const breakdown: Record<number, number> = {};

    pages.forEach((page) => {
      let pagePenalty = 0;
      sessionErrors.forEach((err) => {
        if (err.words && err.words.length > 0) {
          const errPage = getPageForAyah(err.words[0].surahId, err.words[0].ayahId);
          if (Number(errPage) === Number(page)) {
            if (err.type === 'jali') pagePenalty += scoringConfig.penaltyJali;
            if (err.type === 'tark') pagePenalty += scoringConfig.penaltyTark;
            if (err.type === 'khafi') pagePenalty += scoringConfig.penaltyKhafi;
          }
        }
      });
      breakdown[page] = Math.max(0, scoringConfig.scoreInitial - pagePenalty);
    });

    return breakdown;
  };

  // Synchronize student dynamic level bounds
  useEffect(() => {
    if (!selectedStudent) return;
    const selectedStudentObj = students.find((s) => s.id.toString() === selectedStudent);
    const level = selectedStudentObj?.level;
    if (!level) return;

    const allowedJuzs = level.juzList.split(',').map((j: string) => parseInt(j.trim())).filter((j: number) => !isNaN(j));
    if (allowedJuzs.length > 0) {
      if (selectionMode === 'juz') {
        if (juzId && !allowedJuzs.includes(parseInt(juzId))) {
          const firstAllowed = allowedJuzs[0].toString();
          setJuzId(firstAllowed);
          const pages = getJuzPageRange(parseInt(firstAllowed));
          setStartPage(pages.start.toString());
          setEndPage(pages.start.toString());
        }
      } else {
        // selectionMode === 'surah'
        const allowedSurahIds = getAllowedSurahIdsForJuzList(allowedJuzs);
        if (selectedSurah && allowedSurahIds.length > 0 && !allowedSurahIds.includes(parseInt(selectedSurah))) {
          setSelectedSurah(allowedSurahIds[0].toString());
          setStartAyah('1');
          setEndAyah('1');
        }
      }
    }
  }, [selectedStudent, selectionMode, students]);

  // Recalculate score dynamically in Quick-Log mode
  useEffect(() => {
    if (isQuickLogMode && activeSession) {
      const calculated = Math.max(0, scoringConfig.scoreInitial - (
        quickJaliCount * scoringConfig.penaltyJali +
        quickKhafiCount * scoringConfig.penaltyKhafi +
        quickTarkCount * scoringConfig.penaltyTark
      ));
      setScore(calculated);
    }
  }, [isQuickLogMode, quickJaliCount, quickKhafiCount, quickTarkCount, scoringConfig, activeSession]);

  // Auto-save active session to localStorage as a draft
  useEffect(() => {
    if (activeSession) {
      const draft = {
        selectedStudent,
        sessionType,
        selectionMode,
        selectedSurah,
        startAyah,
        endAyah,
        juzId,
        startPage,
        endPage,
        sessionErrors,
        score,
        notesUstadz,
      };
      localStorage.setItem('sita_session_draft', JSON.stringify(draft));
    } else {
      localStorage.removeItem('sita_session_draft');
    }
  }, [
    activeSession,
    selectedStudent,
    sessionType,
    selectionMode,
    selectedSurah,
    startAyah,
    endAyah,
    juzId,
    startPage,
    endPage,
    sessionErrors,
    score,
    notesUstadz,
  ]);

  // Check for active session draft on load once students are loaded
  useEffect(() => {
    if (students.length > 0) {
      const savedDraft = localStorage.getItem('sita_session_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed && parsed.selectedStudent) {
            setDraftToRecover(parsed);
            setShowDraftModal(true);
          }
        } catch (e) {
          console.error('Error parsing session draft:', e);
        }
      }
    }
  }, [students]);

  const handleRestoreDraft = () => {
    if (!draftToRecover) return;
    setSelectedStudent(draftToRecover.selectedStudent);
    setSessionType(draftToRecover.sessionType);
    setSelectionMode(draftToRecover.selectionMode);
    setSelectedSurah(draftToRecover.selectedSurah);
    setStartAyah(draftToRecover.startAyah);
    setEndAyah(draftToRecover.endAyah);
    setJuzId(draftToRecover.juzId);
    setStartPage(draftToRecover.startPage);
    setEndPage(draftToRecover.endPage);
    setSessionErrors(draftToRecover.sessionErrors);
    setScore(draftToRecover.score);
    setNotesUstadz(draftToRecover.notesUstadz);
    
    setActiveSession(true);
    setActiveTab('talaqqi');
    
    setShowDraftModal(false);
    setDraftToRecover(null);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('sita_session_draft');
    setShowDraftModal(false);
    setDraftToRecover(null);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeSession) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeSession]);

  useEffect(() => {
    const currentUser = api.getUser();
    if (!currentUser || currentUser.role !== 'ustadz') {
      navigate('/login');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (adminConfig && !activeSession) {
      setScore(adminConfig.scoreInitial);
    }
  }, [adminConfig, activeSession]);

  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0].id.toString());
    }
  }, [students, selectedStudent]);

  // Load Quran text for session replay detail
  useEffect(() => {
    if (!selectedLog) return;

    const isJuzOrPageSession = selectedLog.juzId !== null || selectedLog.startPage !== null || selectedLog.pageNumber !== null;

    if (isJuzOrPageSession) {
      let startP = 1;
      let endP = 1;

      if (selectedLog.startPage !== null && selectedLog.endPage !== null) {
        startP = Number(selectedLog.startPage);
        endP = Number(selectedLog.endPage);
      } else if (selectedLog.pageNumber !== null) {
        startP = Number(selectedLog.pageNumber);
        endP = Number(selectedLog.pageNumber);
      } else if (selectedLog.juzId !== null) {
        const bounds = getJuzPageRange(Number(selectedLog.juzId));
        startP = bounds.start;
        endP = bounds.end;
      }

      const pagesToLoad: number[] = [];
      for (let p = startP; p <= endP; p++) {
        pagesToLoad.push(p);
      }

      setLogQuran(null);

      Promise.all(
        pagesToLoad.map((p) => {
          const ranges = QURAN_PAGE_MAPPINGS[p];
          if (!ranges || ranges.length === 0) return Promise.resolve(null);
          return Promise.all(
            ranges.map((r) => api.getAyahs(r.surahId, r.startAyah, r.endAyah))
          ).then((results) => ({ page: p, results }));
        })
      )
        .then((pagesResults) => {
          const mergedAyahs: any[] = [];
          const namesMap: Record<number, { nameAr: string; nameEn: string }> = {};

          pagesResults.forEach((pr) => {
            if (!pr) return;
            pr.results.forEach((res: any) => {
              if (!res) return;
              namesMap[res.surah_id] = { nameAr: res.surah_name_ar, nameEn: res.surah_name_id };
              res.ayahs.forEach((a: any) => {
                const exists = mergedAyahs.some(
                  (existing) => existing.surahId === res.surah_id && existing.ayah_id === a.ayah_id
                );
                if (!exists) {
                  mergedAyahs.push({
                    id: a.id,
                    ayah_id: a.ayah_id,
                    surahId: res.surah_id,
                    text: a.text,
                    words: a.words,
                  });
                }
              });
            });
          });

          setLogQuran({
            surah_id: selectedLog.surahId,
            surah_name_ar: 'Multiple Surahs',
            surah_name_id: 'Multiple Surahs',
            ayahs: mergedAyahs,
          });
        })
        .catch(console.error);
    } else {
      api.getAyahs(selectedLog.surahId, selectedLog.startAyah, selectedLog.endAyah)
        .then(setLogQuran)
        .catch(console.error);
    }
  }, [selectedLog]);

  // TanStack Query handles student progress and heatmap fetching automatically

  // Calculate recommendation & prerequisite lock alerts when state changes
  useEffect(() => {
    if (!selectedStudent || !studentProgress || selectionMode !== 'juz') return;

    const selectedJuzNum = parseInt(juzId);
    if (isNaN(selectedJuzNum)) return;
    
    const history = studentProgress.scoreHistory || [];
    const passedSessions = history.filter((h: any) => h.status === 'lulus');

    // 1. Prerequisite Lock Check (Must pass preceding Juz Tasmi' if selectedJuz > 1)
    if (selectedJuzNum > 1) {
      const prevJuzPassedTasmi = passedSessions.find(
        (h: any) => h.juzId === selectedJuzNum - 1 && h.setoranScope === 'tasmi_juz'
      );
      
      if (selectedJuzNum === 30 && !prevJuzPassedTasmi) {
        setPrerequisiteAlert(
          `⚠️ Peringatan Progresi: Santri belum dinyatakan LULUS pada Tasmi' Juz 29. Disarankan menuntaskan Tasmi' Juz 29 terlebih dahulu sebelum memulai Juz 30.`
        );
      } else {
        setPrerequisiteAlert(null);
      }
    } else {
      setPrerequisiteAlert(null);
    }

    // 2. Calculate Recommendation & Milestone Locks inside the selected Juz
    const pagesInJuz: number[] = [];
    const bounds = getJuzPageRange(selectedJuzNum);
    for (let p = bounds.start; p <= bounds.end; p++) {
      pagesInJuz.push(p);
    }

    const passedSessionsThisJuz = passedSessions.filter((h: any) => h.juzId === selectedJuzNum);

    // Find all individual pages completed in the selected Juz
    const passedPages = passedSessionsThisJuz.flatMap((h: any) => {
      if (h.setoranScope === 'halaman' && h.pageNumber) return [h.pageNumber];
      if (['range_halaman', 'quarter_juz', 'half_juz', 'three_quarter_juz', 'tasmi_juz'].includes(h.setoranScope) && h.startPage && h.endPage) {
        const list = [];
        for (let p = h.startPage; p <= h.endPage; p++) list.push(p);
        return list;
      }
      return [];
    });

    const uniquePassedPages = Array.from(new Set(passedPages)) as number[];
    const passedPageCount = uniquePassedPages.filter(p => p >= bounds.start && p <= bounds.end).length;

    const passedQuarter = passedSessionsThisJuz.some((h: any) => ['quarter_juz', 'half_juz', 'three_quarter_juz', 'tasmi_juz'].includes(h.setoranScope));
    const passedHalf = passedSessionsThisJuz.some((h: any) => ['half_juz', 'three_quarter_juz', 'tasmi_juz'].includes(h.setoranScope));
    const passedThreeQuarter = passedSessionsThisJuz.some((h: any) => ['three_quarter_juz', 'tasmi_juz'].includes(h.setoranScope));
    const passedTasmi = passedSessionsThisJuz.some((h: any) => h.setoranScope === 'tasmi_juz');

    setIsPageSelectionLocked(false);

    if (passedPageCount >= 20 && !passedTasmi) {
      setRecommendation(`Milestone Hafidz Mutqin: Wajib Ujian Tasmi' 1 Juz Penuh`);
      setStartPage(bounds.start.toString());
      setEndPage(bounds.end.toString());
      setSessionType('murajaah');
      setIsPageSelectionLocked(true);
    } else if (passedPageCount >= 15 && !passedThreeQuarter) {
      setRecommendation(`Milestone Hafidz Mutqin: Wajib Murajaah 3/4 Juz`);
      setStartPage(bounds.start.toString());
      setEndPage(Math.min(bounds.start + 14, bounds.end).toString());
      setSessionType('murajaah');
      setIsPageSelectionLocked(true);
    } else if (passedPageCount >= 10 && !passedHalf) {
      setRecommendation(`Milestone Hafidz Mutqin: Wajib Murajaah 1/2 Juz`);
      setStartPage(bounds.start.toString());
      setEndPage(Math.min(bounds.start + 9, bounds.end).toString());
      setSessionType('murajaah');
      setIsPageSelectionLocked(true);
    } else if (passedPageCount >= 5 && !passedQuarter) {
      setRecommendation(`Milestone Hafidz Mutqin: Wajib Murajaah 1/4 Juz`);
      setStartPage(bounds.start.toString());
      setEndPage(Math.min(bounds.start + 4, bounds.end).toString());
      setSessionType('murajaah');
      setIsPageSelectionLocked(true);
    } else {
      const nextUncompletedPage = pagesInJuz.find((p) => !passedPages.includes(p));
      if (nextUncompletedPage) {
        setRecommendation(`Rekomendasi Ziyadah: Halaman ${nextUncompletedPage}`);
        setStartPage(nextUncompletedPage.toString());
        setEndPage(nextUncompletedPage.toString());
        setSessionType('setoran_baru');
      } else if (passedTasmi) {
        setRecommendation(`Juz ${selectedJuzNum} Selesai Tasmi' & Lulus. Siap lanjut ke Juz berikutnya.`);
      }
    }
  }, [juzId, studentProgress, selectedStudent, selectionMode]);

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Pilih santri terlebih dahulu.');
      return;
    }
    setScore(scoringConfig.scoreInitial);
    setSessionErrors([]);
    setNotesUstadz('');
    setQuickJaliCount(0);
    setQuickKhafiCount(0);
    setQuickTarkCount(0);
    setIsQuickLogMode(false);
    setActiveSession(true);
  };

  const handleSaveSession = () => {
    if (!selectedStudent) return;

    const startPNum = parseInt(startPage);
    const endPNum = parseInt(endPage);
    const resolvedMapping = selectionMode === 'juz'
      ? getMappingForPageRange(startPNum, endPNum)
      : { surahId: parseInt(selectedSurah), startAyah: parseInt(startAyah), endAyah: parseInt(endAyah) };

    const bounds = selectionMode === 'juz' ? getJuzPageRange(parseInt(juzId)) : null;
    const isFullJuz = bounds ? (startPNum === bounds.start && endPNum === bounds.end) : false;
    const currentIsPassed = score >= scoringConfig.passThreshold;

    // Construct quick log errors array if in quick log mode
    const finalErrors = isQuickLogMode
      ? [
          ...Array.from({ length: quickJaliCount }).map((_, i) => ({
            type: 'jali',
            words: [{ ayahId: resolvedMapping.startAyah, wordIdx: i, text: `Salah Jali #${i + 1}` }]
          })),
          ...Array.from({ length: quickKhafiCount }).map((_, i) => ({
            type: 'khafi',
            words: [{ ayahId: resolvedMapping.startAyah, wordIdx: i, text: `Salah Khafi #${i + 1}` }]
          })),
          ...Array.from({ length: quickTarkCount }).map((_, i) => ({
            type: 'tark',
            words: [{ ayahId: resolvedMapping.startAyah, wordIdx: i, text: `Salah Tark #${i + 1}` }]
          }))
        ]
      : sessionErrors;

    setSaving(true);
    finishSessionMutation.mutateAsync({
      studentId: parseInt(selectedStudent),
      surahId: resolvedMapping.surahId,
      startAyah: resolvedMapping.startAyah,
      endAyah: resolvedMapping.endAyah,
      sessionType,
      errors: finalErrors,
      notesUstadz: notesUstadz.trim() || undefined,
      juzId: selectionMode === 'juz' ? parseInt(juzId) : undefined,
      setoranScope: selectionMode === 'juz'
        ? (isFullJuz ? 'tasmi_juz' : (
            startPNum === bounds!.start && endPNum === bounds!.start + 4 ? 'quarter_juz' :
            startPNum === bounds!.start && endPNum === bounds!.start + 9 ? 'half_juz' :
            startPNum === bounds!.start && endPNum === bounds!.start + 14 ? 'three_quarter_juz' :
            (startPNum === endPNum ? 'halaman' : 'range_halaman')
          ))
        : undefined,
      pageNumber: selectionMode === 'juz' && startPNum === endPNum ? startPNum : undefined,
      startPage: selectionMode === 'juz' ? startPNum : undefined,
      endPage: selectionMode === 'juz' ? endPNum : undefined,
      scoreFinal: score,
      status: currentIsPassed ? 'lulus' : 'mengulang',
    })
      .then(() => {
        alert('Sesi setoran berhasil disimpan!');
        setActiveSession(false);
        setScore(scoringConfig.scoreInitial);
        setSessionErrors([]);
        setNotesUstadz('');
        setQuickJaliCount(0);
        setQuickKhafiCount(0);
        setQuickTarkCount(0);
        setIsQuickLogMode(false);
        // TanStack Query automatically refetches sessions & student progress via mutation invalidation
      })
      .catch((err) => {
        console.error(err);
        alert('Gagal menyimpan sesi: ' + err.message);
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleCancelSession = () => {
    if (window.confirm('Yakin ingin membatalkan sesi ini? Data tidak akan disimpan.')) {
      setActiveSession(false);
      setScore(scoringConfig.scoreInitial);
      setSessionErrors([]);
      setNotesUstadz('');
      setQuickJaliCount(0);
      setQuickKhafiCount(0);
      setQuickTarkCount(0);
      setIsQuickLogMode(false);
    }
  };

  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
  };

  if (loading) {
    return <LoadingFallback />;
  }

  const selectedStudentObj = students.find((s) => s.id.toString() === selectedStudent);
  const isPassed = score >= scoringConfig.passThreshold;
  // isPassed is only used in JSX below this point (e.g. status badge display)

  // Counts for summary
  const jaliCount = isQuickLogMode ? quickJaliCount : sessionErrors.filter((e) => e.type === 'jali').length;
  const khafiCount = isQuickLogMode ? quickKhafiCount : sessionErrors.filter((e) => e.type === 'khafi').length;
  const tarkCount = isQuickLogMode ? quickTarkCount : sessionErrors.filter((e) => e.type === 'tark').length;

  const getStudentStats = (studentId: number) => {
    const studentSessions = sessions.filter(s => s.studentId === studentId);
    const avg = studentSessions.length > 0
      ? Math.round(studentSessions.reduce((sum, s) => sum + s.scoreFinal, 0) / studentSessions.length)
      : 100;
    return {
      total: studentSessions.length,
      avg,
      latest: studentSessions[0] ? new Date(studentSessions[0].createdAt).toLocaleDateString('id-ID') : '-'
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-sans">
      {/* Mobile Drawer Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm flex items-center justify-between px-4 h-16 lg:hidden w-full">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          {appLogo ? (
            <img src={appLogo} alt={appName} className="h-8 w-auto object-contain rounded-lg" />
          ) : (
            <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-black">
              {appName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-extrabold text-gray-900 text-md leading-tight">{appName} Ustadz</h1>
            <p className="text-[10px] text-gray-500 font-medium">Workstation Talaqqi</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <NotificationCenter />
        </div>
      </header>

      {/* Sidebar Navigation - Responsive Desktop + Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-all duration-300 transform lg:translate-x-0 lg:static lg:h-screen lg:flex-shrink-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          isSidebarCollapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        {/* Brand Header */}
        <div className={cn(
          "h-16 flex items-center border-b border-slate-800/80 justify-between gap-3 transition-all duration-300",
          isSidebarCollapsed ? "px-4" : "px-6"
        )}>
          <div className="flex items-center gap-3 overflow-hidden">
            {appLogo ? (
              <img src={appLogo} alt={appName} className="h-9 w-auto object-contain rounded-xl shrink-0" />
            ) : (
              <div className="w-9 h-9 bg-emerald-500 text-slate-950 rounded-xl flex items-center justify-center font-black text-lg shrink-0">
                {appName.charAt(0).toUpperCase()}
              </div>
            )}
            {!isSidebarCollapsed && (
              <div className="animate-fadeIn truncate">
                <h1 className="font-black text-white text-base tracking-wide leading-none uppercase truncate max-w-[120px]">{appName}</h1>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1 block">Musyrif Panel</span>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex items-center justify-center bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-slate-200 p-1.5 rounded-xl transition-all cursor-pointer shrink-0"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Menu Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => {
              if (activeSession) {
                alert("Sesi Talaqqi sedang aktif! Harap simpan atau batalkan sesi terlebih dahulu sebelum berpindah menu.");
                return;
              }
              setActiveTab('analytics');
              setIsMobileMenuOpen(false);
            }}
            className={cn(
              "w-full flex items-center rounded-xl text-sm font-bold transition-all duration-200",
              isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-start space-x-3 px-4 py-3",
              activeTab === 'analytics'
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            )}
            title={isSidebarCollapsed ? "Analitik Halaqah" : undefined}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="animate-fadeIn">Analitik Halaqah</span>}
          </button>

          <button
            onClick={() => {
              setActiveTab('talaqqi');
              setIsMobileMenuOpen(false);
            }}
            className={cn(
              "w-full flex items-center rounded-xl text-sm font-bold transition-all duration-200 relative",
              isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-start space-x-3 px-4 py-3",
              activeTab === 'talaqqi'
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            )}
            title={isSidebarCollapsed ? "Interaktif Talaqqi" : undefined}
          >
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="animate-fadeIn">Interaktif Talaqqi</span>}
            {activeSession && (
              <span className={cn(
                "rounded-full bg-red-500 animate-ping",
                isSidebarCollapsed ? "absolute right-3 top-3 w-1.5 h-1.5" : "absolute right-3 top-4.5 w-2 h-2"
              )}></span>
            )}
          </button>

          <button
            onClick={() => {
              if (activeSession) {
                alert("Sesi Talaqqi sedang aktif! Harap simpan atau batalkan sesi terlebih dahulu sebelum berpindah menu.");
                return;
              }
              setActiveTab('history');
              setIsMobileMenuOpen(false);
            }}
            className={cn(
              "w-full flex items-center rounded-xl text-sm font-bold transition-all duration-200",
              isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-start space-x-3 px-4 py-3",
              activeTab === 'history'
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            )}
            title={isSidebarCollapsed ? "Mutaba'ah Santri" : undefined}
          >
            <History className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="animate-fadeIn">Mutaba'ah Santri</span>}
          </button>

          {/* Sesi Tasmi sudah terintegrasi ke dalam sub-tab Mutaba'ah Muraja'ah & Tasmi' */}

          <button
            onClick={() => {
              if (activeSession) {
                alert("Sesi Talaqqi sedang aktif! Harap simpan atau batalkan sesi terlebih dahulu sebelum berpindah menu.");
                return;
              }
              setActiveTab('ledger');
              setIsMobileMenuOpen(false);
            }}
            className={cn(
              "w-full flex items-center rounded-xl text-sm font-bold transition-all duration-200",
              isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-start space-x-3 px-4 py-3",
              activeTab === 'ledger'
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            )}
            title={isSidebarCollapsed ? "Ledger Nilai" : undefined}
          >
            <BookMarked className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="animate-fadeIn">Ledger Nilai</span>}
          </button>

          <button
            onClick={() => {
              if (activeSession) {
                alert("Sesi Talaqqi sedang aktif! Harap simpan atau batalkan sesi terlebih dahulu sebelum berpindah menu.");
                return;
              }
              setActiveTab('komunikasi');
              setIsMobileMenuOpen(false);
            }}
            className={cn(
              "w-full flex items-center rounded-xl text-sm font-bold transition-all duration-200",
              isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-start space-x-3 px-4 py-3",
              activeTab === 'komunikasi'
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            )}
            title={isSidebarCollapsed ? "Buku Penghubung" : undefined}
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="animate-fadeIn">Buku Penghubung</span>}
          </button>

          <button
            onClick={() => {
              if (activeSession) {
                alert("Sesi Talaqqi sedang aktif! Harap simpan atau batalkan sesi terlebih dahulu sebelum berpindah menu.");
                return;
              }
              setActiveTab('home_murajaah');
              setIsMobileMenuOpen(false);
            }}
            className={cn(
              "w-full flex items-center rounded-xl text-sm font-bold transition-all duration-200",
              isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-start space-x-3 px-4 py-3",
              activeTab === 'home_murajaah'
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            )}
            title={isSidebarCollapsed ? "Muraja'ah Rumah" : undefined}
          >
            <Clock className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="animate-fadeIn">Muraja'ah Rumah</span>}
          </button>
        </nav>

        {/* Sidebar Footer User Profile */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className={cn(
            "flex items-center px-2 py-1.5",
            isSidebarCollapsed ? "justify-center space-x-0" : "space-x-3"
          )}>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-extrabold text-sm uppercase shrink-0">
              {user?.name?.substring(0, 2) || 'US'}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 animate-fadeIn">
                <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 font-semibold truncate">Musyrif Halaqah</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              "mt-4 flex items-center justify-center bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer",
              isSidebarCollapsed ? "w-10 h-10 px-0 mx-auto" : "w-full py-2.5 px-4 space-x-2"
            )}
            title={isSidebarCollapsed ? "Keluar Sistem" : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="animate-fadeIn">Keluar Sistem</span>}
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs lg:hidden"
        ></div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-gray-50 pb-16">
        {/* Desktop Top Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm hidden lg:block w-full">
          <div className="mx-auto px-8 h-16 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-gray-900 text-lg leading-tight">
                {activeTab === 'analytics' && 'Dashboard Analitik Halaqah'}
                {activeTab === 'talaqqi' && 'Konsol Workstation Talaqqi'}
                {activeTab === 'history' && 'Mutaba\'ah Hafalan Santri'}
                {activeTab === 'ledger' && 'Buku Induk Ledger Nilai'}
                {activeTab === 'komunikasi' && 'Buku Penghubung Wali Santri'}
                {activeTab === 'home_murajaah' && 'Tugas & Laporan Muraja\'ah Mandiri'}
              </h2>
              <p className="text-xs text-gray-400 font-medium">Selamat bertugas kembali, Ustadz {user?.name} | {appName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter />
            </div>
          </div>
        </header>

        <main className="px-4 lg:px-8 mt-6 w-full max-w-7xl mx-auto flex-1">
          {/* TAB 1: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Metrik Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-fadeIn">
                {/* Metrik 1 */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Total Santri</p>
                    <p className="text-2xl font-black text-gray-800">{students.length}</p>
                  </div>
                </div>

                {/* Metrik 2 */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-4">
                  <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Total Setoran</p>
                    <p className="text-2xl font-black text-gray-800">{sessions.length}</p>
                  </div>
                </div>

                {/* Metrik 3 */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Rata-rata Nilai</p>
                    <p className="text-2xl font-black text-gray-800">
                      {sessions.length > 0
                        ? Math.round(sessions.reduce((sum, s) => sum + s.scoreFinal, 0) / sessions.length)
                        : 100}
                    </p>
                  </div>
                </div>

                {/* Metrik 4 */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Rasio Kelulusan</p>
                    <p className="text-2xl font-black text-gray-800">
                      {sessions.length > 0
                        ? Math.round((sessions.filter(s => s.status === 'lulus').length / sessions.length) * 100)
                        : 100}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Widget Cerdas: Santri Siap Ujian Juziyah */}
              {readyForExams.length > 0 && (
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl animate-fadeIn relative overflow-hidden border border-slate-800">
                  {/* Decorative background gradients */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl flex items-center justify-center animate-pulse">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-base tracking-tight text-white">Santri Siap Ujian Juziyah</h3>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">Ditemukan {readyForExams.length} santri yang telah menyelesaikan setoran 1 Juz penuh & lulus Tasmi'.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                      {readyForExams.map(({ student, juz, examRequest }) => {
                        const juzLabel = JUZ_LABELS[juz] ? `Juz ${juz} — ${JUZ_LABELS[juz]}` : `Juz ${juz}`;
                        
                        return (
                          <div 
                            key={`${student.id}-${juz}`}
                            className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-md hover:border-indigo-500/40 hover:bg-white/8 transition-all duration-300"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                                  {juzLabel}
                                </span>
                                
                                {/* Status Badge */}
                                {!examRequest && (
                                  <span className="text-[10px] font-black text-amber-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                    Siap Diajukan
                                  </span>
                                )}
                                {examRequest?.status === 'pending' && (
                                  <span className="text-[10px] font-black text-indigo-300 flex items-center gap-1">
                                    <Clock className="w-3 h-3 animate-spin" />
                                    Menunggu Ujian
                                  </span>
                                )}
                                {examRequest?.status === 'mengulang' && (
                                  <span className="text-[10px] font-black text-rose-400 flex items-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    Ulangi Ujian
                                  </span>
                                )}
                              </div>

                              <h4 className="font-extrabold text-sm text-white">{student.name}</h4>
                              <p className="text-[10px] text-slate-400 font-semibold mt-1">NIS: {student.nis} | Level: {student.level?.name || 'Reguler'}</p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                              <span className="text-[10px] text-slate-500 font-bold">
                                {examRequest ? `Diajukan: ${new Date(examRequest.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : 'Setoran & Tasmi\' 100%'}
                              </span>

                              {/* Action Button */}
                              {!examRequest && (
                                <button
                                  type="button"
                                  onClick={() => handleRequestJuziyahExam(student.id.toString(), juz)}
                                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow-md transition-all uppercase tracking-wide cursor-pointer border-none"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  Ajukan Ujian
                                </button>
                              )}
                              {examRequest?.status === 'pending' && (
                                <button
                                  type="button"
                                  disabled
                                  className="bg-indigo-950/80 text-indigo-300/60 border border-indigo-850/50 font-extrabold text-[10px] px-3.5 py-1.5 rounded-xl flex items-center gap-1 uppercase tracking-wide cursor-not-allowed"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  Diproses...
                                </button>
                              )}
                              {examRequest?.status === 'mengulang' && (
                                <button
                                  type="button"
                                  onClick={() => handleRequestJuziyahExam(student.id.toString(), juz)}
                                  className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow-md transition-all uppercase tracking-wide cursor-pointer border-none"
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                  Ajukan Ulang
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Table Card */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden animate-fadeIn">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-gray-800 text-base">Progresi Capaian Halaqah</h3>
                    <p className="text-xs text-gray-400 font-medium mt-1">Daftar capaian dan pemicu talaqqi interaktif cepat santri.</p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="py-4 px-6">NIS</th>
                        <th className="py-4 px-6">Nama Santri</th>
                        <th className="py-4 px-6 text-center">Total Sesi</th>
                        <th className="py-4 px-6 text-center">Rata-rata Nilai</th>
                        <th className="py-4 px-6 text-center">Sesi Terakhir</th>
                        <th className="py-4 px-6 text-center">Aksi Talaqqi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400">Tidak ada santri di halaqah ini.</td>
                        </tr>
                      ) : (
                        students.map((student) => {
                          const stats = getStudentStats(student.id);
                          return (
                            <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 px-6 text-xs text-gray-400 font-bold">{student.nis}</td>
                              <td className="py-4 px-6 text-gray-900 font-bold">{student.name}</td>
                              <td className="py-4 px-6 text-center font-bold">{stats.total} Sesi</td>
                              <td className="py-4 px-6 text-center">
                                <span className={cn(
                                  "inline-block px-2.5 py-0.5 rounded-lg text-xs font-black",
                                  stats.avg >= 80 ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
                                )}>
                                  {stats.avg}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center text-xs text-gray-400">{stats.latest}</td>
                              <td className="py-4 px-6 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedStudent(student.id.toString());
                                    setActiveTab('talaqqi');
                                  }}
                                  className="inline-flex items-center space-x-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 rounded-lg text-xs font-bold transition-all"
                                >
                                  <span>Simak Sesi</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TALAQQI WORKSTATION */}
          {activeTab === 'talaqqi' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 w-full animate-fadeIn">
              {/* Left Sidebar Console Panel */}
              <div className="lg:col-span-1">
                {!activeSession ? (
                  // Inactive Setup Sidebar Form
                  <div className="bg-white rounded-3xl shadow-xs border border-gray-100 p-6 space-y-5 sticky top-20">
                    <div>
                      <h2 className="text-lg font-extrabold text-gray-800">Inisiasi Sesi</h2>
                      {selectedStudentObj?.level && (
                        <div className="bg-emerald-50 border border-emerald-100/70 rounded-2xl p-4 text-xs font-bold mt-3 animate-fadeIn">
                          <p className="text-[10px] text-emerald-600 uppercase tracking-wider">Level Target Santri</p>
                          <p className="mt-1 text-emerald-950 font-extrabold text-sm">{selectedStudentObj.level.name}</p>
                          <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-emerald-100/50 text-[10px] text-emerald-700 font-bold">
                            <span>Target: {selectedStudentObj.level.targetDays} Hari</span>
                            <span>Jumlah: {selectedStudentObj.level.juzCount} Juz</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Mode Toggle: Juz vs Surah */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Metode Setoran</label>
                      <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                        <button
                          type="button"
                          onClick={() => setSelectionMode('juz')}
                          className={cn(
                            'py-2 rounded-lg font-bold text-xs transition-all',
                            selectionMode === 'juz'
                              ? 'bg-white text-emerald-800 shadow-xs border border-gray-150'
                              : 'text-gray-400 hover:text-gray-600'
                          )}
                        >
                          Per Juz
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectionMode('surah')}
                          className={cn(
                            'py-2 rounded-lg font-bold text-xs transition-all',
                            selectionMode === 'surah'
                              ? 'bg-white text-emerald-800 shadow-xs border border-gray-155'
                              : 'text-gray-400 hover:text-gray-600'
                          )}
                        >
                          Per Surah
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleStartSession} className="space-y-5">
                      {/* Student Select */}
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Santri</label>
                        <select
                          value={selectedStudent}
                          onChange={(e) => setSelectedStudent(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-805 font-medium transition-all text-sm cursor-pointer"
                        >
                          {students.length === 0 ? (
                            <option value="">Tidak ada santri</option>
                          ) : (
                            students.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} (NIS: {s.nis})
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Session Type */}
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Jenis Sesi</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSessionType('setoran_baru')}
                            className={cn(
                              'py-2.5 rounded-xl font-bold text-xs border transition-all',
                              sessionType === 'setoran_baru'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                            )}
                          >
                            Setoran Baru
                          </button>
                          <button
                            type="button"
                            onClick={() => setSessionType('murajaah')}
                            className={cn(
                              'py-2.5 rounded-xl font-bold text-xs border transition-all',
                              sessionType === 'murajaah'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                            )}
                          >
                            Murajaah
                          </button>
                        </div>
                      </div>

                      {/* Prerequisite lock alert for Juz Mode */}
                      {selectionMode === 'juz' && prerequisiteAlert && (
                        <div className="bg-red-50 border border-red-100 text-red-805 rounded-2xl p-4 text-xs font-bold leading-relaxed flex gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                          <span>{prerequisiteAlert}</span>
                        </div>
                      )}

                      {/* Recommendation alert for Juz Mode */}
                      {selectionMode === 'juz' && recommendation && (
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-805 rounded-2xl p-4 text-xs font-bold flex flex-col gap-2 leading-relaxed">
                          <div className="flex items-start gap-2">
                            <BookOpen className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] text-emerald-600 uppercase tracking-wider">Rekomendasi Target</p>
                              <p className="mt-0.5 text-emerald-900">{recommendation}</p>
                            </div>
                          </div>
                          {recommendation.includes("Selesai Tasmi' & Lulus") && (
                            <div className="mt-2 pt-2 border-t border-emerald-100/50 flex flex-col gap-2">
                              {(() => {
                                const activeExamRequest = selectedStudentObj?.examsAsStudent?.find((e: any) => e.juzId === Number(juzId));
                                if (!activeExamRequest) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => handleRequestJuziyahExam(selectedStudent, Number(juzId))}
                                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all uppercase tracking-wide cursor-pointer border-none w-full"
                                    >
                                      <Award className="w-4 h-4" />
                                      Ajukan Ujian Juziyah
                                    </button>
                                  );
                                }
                                if (activeExamRequest.status === 'pending') {
                                  return (
                                    <div className="bg-indigo-100/50 border border-indigo-200 text-indigo-800 rounded-xl p-3 text-center flex items-center justify-center gap-2">
                                      <Clock className="w-4 h-4 animate-spin text-indigo-600" />
                                      <span>Menunggu Jadwal Ujian Juziyah dari Koordinator</span>
                                    </div>
                                  );
                                }
                                if (activeExamRequest.status === 'mengulang') {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => handleRequestJuziyahExam(selectedStudent, Number(juzId))}
                                      className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all uppercase tracking-wide cursor-pointer border-none w-full animate-pulse"
                                    >
                                      <Zap className="w-4 h-4" />
                                      Ajukan Ulang Ujian Juziyah
                                    </button>
                                  );
                                }
                                if (activeExamRequest.status === 'lulus') {
                                  return (
                                    <div className="bg-emerald-100/50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-center flex items-center justify-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      <span>Lulus Ujian Juziyah (Juz Certified)</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Juz Selection Fields */}
                      {selectionMode === 'juz' && (
                        <>
                          <div>
                            <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Pilih Juz</label>
                            <select
                              value={juzId}
                              onChange={(e) => {
                                const selJuz = e.target.value;
                                setJuzId(selJuz);
                                const pages = getJuzPageRange(parseInt(selJuz));
                                setStartPage(pages.start.toString());
                                setEndPage(pages.start.toString());
                              }}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800 font-bold transition-all text-sm cursor-pointer"
                            >
                              <option value="" disabled hidden>Pilih Juz...</option>
                              {(() => {
                                const allowedJuzs = selectedStudentObj?.level
                                  ? selectedStudentObj.level.juzList.split(',').map((j: string) => parseInt(j.trim())).filter((j: number) => !isNaN(j))
                                  : [];
                                const list = allowedJuzs.length > 0
                                  ? allowedJuzs
                                  : Array.from({ length: 30 }, (_, i) => i + 1);
                                return list.map((j: number) => (
                                  <option key={j} value={j}>
                                    Juz {j}
                                  </option>
                                ));
                              })()}
                            </select>
                          </div>

                          <div className="flex space-x-3">
                            <div className="flex-1">
                              <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Mulai Hal.</label>
                              <select
                                value={startPage}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setStartPage(val);
                                  if (parseInt(endPage) < parseInt(val)) {
                                    setEndPage(val);
                                  }
                                }}
                                disabled={isPageSelectionLocked}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-850 font-bold text-center text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="" disabled hidden>Mulai Hal...</option>
                                {(() => {
                                  if (!juzId) return null;
                                  const bounds = getJuzPageRange(parseInt(juzId));
                                  const list = [];
                                  for (let p = bounds.start; p <= bounds.end; p++) {
                                    list.push(p);
                                  }
                                  return list.map((p) => (
                                    <option key={p} value={p}>
                                      {p}
                                    </option>
                                  ));
                                })()}
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Akhir Hal.</label>
                              <select
                                value={endPage}
                                onChange={(e) => setEndPage(e.target.value)}
                                disabled={isPageSelectionLocked}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-855 font-bold text-center text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="" disabled hidden>Akhir Hal...</option>
                                {(() => {
                                  if (!juzId) return null;
                                  const bounds = getJuzPageRange(parseInt(juzId));
                                  const list = [];
                                  for (let p = parseInt(startPage) || bounds.start; p <= bounds.end; p++) {
                                    list.push(p);
                                  }
                                  return list.map((p) => (
                                    <option key={p} value={p}>
                                      {p}
                                    </option>
                                  ));
                                })()}
                              </select>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Surah Selection Fields */}
                      {selectionMode === 'surah' && (
                        <>
                          <div>
                            <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Pilih Surah</label>
                            <select
                              value={selectedSurah}
                              onChange={(e) => {
                                const selSurah = e.target.value;
                                setSelectedSurah(selSurah);
                                setStartAyah('1');
                                setEndAyah('1');
                              }}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-805 font-bold transition-all text-sm cursor-pointer"
                            >
                              <option value="" disabled hidden>Pilih Surah...</option>
                              {(() => {
                                const allowedJuzs = selectedStudentObj?.level
                                  ? selectedStudentObj.level.juzList.split(',').map((j: string) => parseInt(j.trim())).filter((j: number) => !isNaN(j))
                                  : [];
                                const allowedSurahIds = allowedJuzs.length > 0
                                  ? getAllowedSurahIdsForJuzList(allowedJuzs)
                                  : [];
                                const filteredSurahs = allowedSurahIds.length > 0
                                  ? surahs.filter((s) => allowedSurahIds.includes(s.id))
                                  : surahs;
                                return filteredSurahs.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.id}. {s.nameEn} ({s.nameAr})
                                  </option>
                                ));
                              })()}
                            </select>
                          </div>

                          <div className="flex space-x-3">
                            <div className="flex-1">
                              <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Ayat Mulai</label>
                              <select
                                value={startAyah}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setStartAyah(val);
                                  if (parseInt(endAyah) < parseInt(val)) {
                                    setEndAyah(val);
                                  }
                                }}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800 font-bold text-center text-sm cursor-pointer"
                              >
                                <option value="" disabled hidden>Ayat...</option>
                                {(() => {
                                  if (!selectedSurah) return null;
                                  const total = getSurahTotalAyahs(parseInt(selectedSurah));
                                  const list = [];
                                  for (let i = 1; i <= total; i++) {
                                    list.push(i);
                                  }
                                  return list.map((i) => (
                                    <option key={i} value={i}>
                                      {i}
                                    </option>
                                  ));
                                })()}
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Ayat Akhir</label>
                              <select
                                value={endAyah}
                                onChange={(e) => setEndAyah(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800 font-bold text-center text-sm cursor-pointer"
                              >
                                <option value="" disabled hidden>Ayat...</option>
                                {(() => {
                                  if (!selectedSurah) return null;
                                  const total = getSurahTotalAyahs(parseInt(selectedSurah));
                                  const list = [];
                                  for (let i = parseInt(startAyah) || 1; i <= total; i++) {
                                    list.push(i);
                                  }
                                  return list.map((i) => (
                                    <option key={i} value={i}>
                                      {i}
                                    </option>
                                  ));
                                })()}
                              </select>
                            </div>
                          </div>
                        </>
                      )}

                      <button
                        type="submit"
                        disabled={selectionMode === 'surah' ? (!selectedSurah || !startAyah || !endAyah) : (!juzId || !startPage || !endPage)}
                        className={cn(
                          "w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-2xl py-3.5 font-bold text-sm flex items-center justify-center transition-all shadow-md shadow-emerald-100",
                          (selectionMode === 'surah' ? (!selectedSurah || !startAyah || !endAyah) : (!juzId || !startPage || !endPage)) ? 'opacity-50 cursor-not-allowed' : ''
                        )}
                      >
                        <Play className="w-4 h-4 mr-1.5" /> Mulai Sesi Talaqqi
                      </button>
                    </form>
                  </div>
                ) : (
                  // Active Session Console Sidebar
                  <div className="bg-white rounded-3xl shadow-xs border border-gray-100 p-6 space-y-6 sticky top-20 animate-fadeIn">
                    <div>
                      <h2 className="text-lg font-extrabold text-gray-800">Talaqqi Aktif</h2>
                      <div className="mt-3 space-y-2 text-xs font-semibold text-gray-600 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                        <p>Santri: <strong className="text-gray-800">{selectedStudentObj?.name}</strong></p>
                        {selectionMode === 'juz' ? (
                          <>
                            <p>Materi: <strong className="text-gray-800">Juz {juzId}</strong></p>
                            <p>Halaman: <strong className="text-gray-800">{startPage === endPage ? `Halaman ${startPage}` : `Halaman ${startPage} - ${endPage}`}</strong></p>
                          </>
                        ) : (
                          <>
                            <p>Surah: <strong className="text-gray-800">{surahs.find(s => s.id.toString() === selectedSurah)?.nameEn || selectedSurah}</strong></p>
                            <p>Ayat: <strong className="text-gray-800">{startAyah} - {endAyah}</strong></p>
                          </>
                        )}
                        <p>Tipe: <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold">{sessionType.replace('_', ' ')}</span></p>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700">Mode Input Cepat</span>
                          <span className="text-[10px] text-gray-400">Skor &amp; kesalahan ringkas</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsQuickLogMode(!isQuickLogMode)}
                          className={cn(
                            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                            isQuickLogMode ? "bg-emerald-600" : "bg-gray-200"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                              isQuickLogMode ? "translate-x-5" : "translate-x-0"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Live Score */}
                    <div className="border-t border-gray-100 pt-5 text-center">
                      <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Skor Live</p>
                      <p className="text-5xl font-black text-gray-800 mt-1 leading-none">{score}</p>
                      <div
                        className={cn(
                          'inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs mt-3.5',
                          isPassed ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                        )}
                      >
                        {isPassed ? 'LULUS' : 'MENGULANG'}
                      </div>

                      {/* Per-Page Score Breakdown for Juz Mode */}
                      {selectionMode === 'juz' && getJuzPagesList().length > 1 && (
                        <div className="border-t border-gray-100 pt-4 mt-4 text-right animate-fadeIn" dir="rtl">
                          <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-2 text-center">Rincian Per Halaman</p>
                          <div className="max-h-32 overflow-y-auto space-y-1.5 pl-1">
                            {(() => {
                              const breakdown = getPageScoresBreakdown();
                              if (!breakdown) return null;
                              return Object.entries(breakdown).map(([page, pageScore]) => {
                                const isPagePassed = pageScore >= scoringConfig.passThreshold;
                                return (
                                  <div key={page} className="flex justify-between items-center text-xs bg-gray-50/70 p-2 rounded-xl border border-gray-100 flex-row-reverse">
                                    <span className="font-semibold text-gray-600">Hal. {page}</span>
                                    <span className={cn(
                                      "font-black px-2 py-0.5 rounded-lg text-[11px]",
                                      isPagePassed ? "text-emerald-700 bg-emerald-50 border border-emerald-100/50" : "text-red-700 bg-red-50 border border-red-100/50"
                                    )}>
                                      {pageScore}
                                    </span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dynamic errors breakdown */}
                    {sessionErrors.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-gray-500 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 animate-fadeIn">
                        <div>
                          <span className="text-red-500">Jali (-{scoringConfig.penaltyJali})</span>
                          <span className="block text-sm font-black text-red-700 mt-0.5">{jaliCount}</span>
                        </div>
                        <div>
                          <span className="text-orange-500">Khafi (-{scoringConfig.penaltyKhafi})</span>
                          <span className="block text-sm font-black text-orange-700 mt-0.5">{khafiCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Tark (-{scoringConfig.penaltyTark})</span>
                          <span className="block text-sm font-black text-gray-650 mt-0.5">{tarkCount}</span>
                        </div>
                      </div>
                    )}

                    {/* Built-in Ustadz Evaluation Notes */}
                    <div className="border-t border-gray-100 pt-5">
                      <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                        <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Catatan Evaluasi Ustadz
                      </label>
                      <textarea
                        value={notesUstadz}
                        onChange={(e) => setNotesUstadz(e.target.value)}
                        placeholder="Ketik catatan perbaikan bacaan santri..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-800 placeholder-gray-400 font-medium h-24 resize-none transition-all"
                      />
                    </div>

                    {/* Actions list */}
                    <div className="flex flex-col gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={handleSaveSession}
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold py-3 rounded-2xl shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Menyimpan...' : 'Simpan Sesi'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelSession}
                        className="w-full border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-650 text-gray-550 font-bold py-2.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" /> Batalkan Sesi
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Working Area (Mushaf / Active Quran View) */}
              <div className="lg:col-span-3">
                {activeSession ? (
                  isQuickLogMode ? (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-8 space-y-8 animate-fadeIn max-w-2xl mx-auto">
                      <div className="flex items-center space-x-4 border-b border-gray-100 pb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">Panel Input Cepat (Quick-Log)</h3>
                          <p className="text-xs text-gray-400">Pencatatan setoran instan tanpa visualisasi kata per kata</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Jali Error Counter */}
                        <div className="bg-red-50/50 rounded-2xl border border-red-100/50 p-5 text-center flex flex-col justify-between h-40">
                          <div>
                            <span className="text-xs font-bold text-red-700 block uppercase tracking-wider">Salah Jali</span>
                            <span className="text-[10px] text-red-500 block mt-0.5">Tajwid Berat (-{scoringConfig.penaltyJali})</span>
                          </div>
                          <div className="flex items-center justify-center space-x-4">
                            <button
                              type="button"
                              onClick={() => setQuickJaliCount(Math.max(0, quickJaliCount - 1))}
                              className="w-10 h-10 rounded-xl bg-white border border-red-200 text-red-700 font-bold hover:bg-red-100 active:scale-95 transition-all text-lg flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="text-2xl font-black text-red-800 w-8">{quickJaliCount}</span>
                            <button
                              type="button"
                              onClick={() => setQuickJaliCount(quickJaliCount + 1)}
                              className="w-10 h-10 rounded-xl bg-white border border-red-200 text-red-700 font-bold hover:bg-red-100 active:scale-95 transition-all text-lg flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Khafi Error Counter */}
                        <div className="bg-orange-50/50 rounded-2xl border border-orange-100/50 p-5 text-center flex flex-col justify-between h-40">
                          <div>
                            <span className="text-xs font-bold text-orange-700 block uppercase tracking-wider">Salah Khafi</span>
                            <span className="text-[10px] text-orange-500 block mt-0.5">Tajwid Ringan (-{scoringConfig.penaltyKhafi})</span>
                          </div>
                          <div className="flex items-center justify-center space-x-4">
                            <button
                              type="button"
                              onClick={() => setQuickKhafiCount(Math.max(0, quickKhafiCount - 1))}
                              className="w-10 h-10 rounded-xl bg-white border border-orange-200 text-orange-700 font-bold hover:bg-orange-100 active:scale-95 transition-all text-lg flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="text-2xl font-black text-orange-800 w-8">{quickKhafiCount}</span>
                            <button
                              type="button"
                              onClick={() => setQuickKhafiCount(quickKhafiCount + 1)}
                              className="w-10 h-10 rounded-xl bg-white border border-orange-200 text-orange-700 font-bold hover:bg-orange-100 active:scale-95 transition-all text-lg flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Tark Error Counter */}
                        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-center flex flex-col justify-between h-40">
                          <div>
                            <span className="text-xs font-bold text-gray-700 block uppercase tracking-wider">Salah Tark</span>
                            <span className="text-[10px] text-gray-500 block mt-0.5">Lancar/Kefasihan (-{scoringConfig.penaltyTark})</span>
                          </div>
                          <div className="flex items-center justify-center space-x-4">
                            <button
                              type="button"
                              onClick={() => setQuickTarkCount(Math.max(0, quickTarkCount - 1))}
                              className="w-10 h-10 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 active:scale-95 transition-all text-lg flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="text-2xl font-black text-gray-800 w-8">{quickTarkCount}</span>
                            <button
                              type="button"
                              onClick={() => setQuickTarkCount(quickTarkCount + 1)}
                              className="w-10 h-10 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 active:scale-95 transition-all text-lg flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Manual Override Score Panel */}
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">Ubah Skor Akhir Secara Manual</h4>
                          <p className="text-xs text-gray-400">Biarkan default untuk kalkulasi otomatis, atau geser untuk menyesuaikan</p>
                        </div>
                        <div className="flex items-center space-x-4 min-w-[200px]">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={score}
                            onChange={(e) => setScore(parseInt(e.target.value))}
                            className="w-full accent-emerald-600"
                          />
                          <span className="text-xl font-extrabold text-emerald-600 w-12 text-center">{score}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-gray-50 p-5 rounded-2xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-gray-700">Status Kelulusan:</span>
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border",
                              isPassed ? "bg-emerald-50 text-emerald-700 border-emerald-250" : "bg-red-50 text-red-700 border-red-250"
                            )}
                          >
                            {isPassed ? "LULUS" : "MENGULANG"}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">Ambang Kelulusan: {scoringConfig.passThreshold}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <QuranReader
                        key={`${selectionMode}-${selectedSurah}-${startAyah}-${endAyah}-${startPage}-${endPage}`}
                        selectionMode={selectionMode}
                        surahId={parseInt(selectedSurah)}
                        startAyah={parseInt(startAyah)}
                        endAyah={parseInt(endAyah)}
                        startPage={parseInt(startPage)}
                        endPage={parseInt(endPage)}
                        onScoreChange={handleScoreChange}
                        onErrorsChange={(errs) => setSessionErrors(errs)}
                        scoreInitial={scoringConfig.scoreInitial}
                        penaltyJali={scoringConfig.penaltyJali}
                        penaltyKhafi={scoringConfig.penaltyKhafi}
                        penaltyTark={scoringConfig.penaltyTark}
                        studentHeatmap={studentHeatmap}
                      />
                    </div>
                  )
                ) : (
                  // Welcome empty state
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-12 text-center h-[500px] flex flex-col items-center justify-center max-w-2xl mx-auto">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-xs">
                      <BookOpen className="w-10 h-10 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 mb-3">Mulai Sesi Talaqqi Interaktif</h2>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-md">
                      Silakan pilih santri, metode setoran (Surah / Juz), dan rentang materi setoran di sidebar kiri, kemudian klik tombol "Mulai Sesi Talaqqi" untuk memuat mushaf dan menyimak setoran santri secara real-time.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SETORAN HISTORY (MUTABA'AH) */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Filter controls */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Search className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-bold text-gray-700">Filter Santri:</span>
                  </div>
                  <select
                    value={selectedFilterStudent}
                    onChange={(e) => setSelectedFilterStudent(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">Semua Santri</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub-Tab Selector */}
                <div className="bg-gray-100 p-1 rounded-xl flex border border-gray-200/50">
                  <button
                    type="button"
                    onClick={() => setHistorySubTab('setoran')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      historySubTab === 'setoran' ? "bg-white text-emerald-800 shadow-sm" : "text-gray-500 hover:text-gray-850"
                    )}
                  >
                    Setoran Baru
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistorySubTab('murajaah')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      historySubTab === 'murajaah' ? "bg-white text-emerald-800 shadow-sm" : "text-gray-500 hover:text-gray-850"
                    )}
                  >
                    Muraja'ah & Tasmi'
                  </button>
                </div>
              </div>

              {/* Data list grouped by Juz */}
              <div className="space-y-6">
                {(() => {
                  const filtered = historySubTab === 'setoran'
                    ? sessions.filter(s => s.sessionType === 'setoran_baru')
                    : sessions.filter(s => s.sessionType === 'murajaah' || s.sessionType?.startsWith('tasmi_') || s.sessionType === 'tasmi');
                  
                  const filteredSessions = selectedFilterStudent
                    ? filtered.filter(s => s.studentId.toString() === selectedFilterStudent)
                    : filtered;

                  if (filteredSessions.length === 0) {
                    return (
                      <div className="py-12 text-center text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-xs">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" />
                        <p className="text-sm font-bold">Belum ada data Mutaba'ah {historySubTab === 'setoran' ? 'Setoran Baru' : "Muraja'ah & Tasmi'"} santri.</p>
                      </div>
                    );
                  }

                  // Group by Juz
                  const juzGroups: Record<number, any[]> = {};
                  filteredSessions.forEach((s) => {
                    const juz = getJuzForSession(s);
                    if (!juzGroups[juz]) {
                      juzGroups[juz] = [];
                    }
                    juzGroups[juz].push(s);
                  });

                  const sortedJuzs = Object.keys(juzGroups)
                    .map(Number)
                    .sort((a, b) => a - b);

                  return sortedJuzs.map((juz) => {
                    const sessionsInJuz = juzGroups[juz];
                    const totalPagesInJuz = getTotalPagesInJuz(juz);
                    const currentStudentObj = students.find((s: any) => s.id.toString() === selectedFilterStudent);
                    const examRequest = currentStudentObj?.examsAsStudent?.find((e: any) => e.juzId === juz);

                    // Completion Pct
                    let completionPct = 0;
                    let showCompletion = false;
                    if (selectedFilterStudent !== '') {
                      showCompletion = true;
                      const passedSessionsInJuz = sessions.filter(
                        s => s.studentId.toString() === selectedFilterStudent &&
                             getJuzForSession(s) === juz &&
                             s.status === 'lulus' &&
                             s.sessionType === 'setoran_baru'
                      );
                      const uniquePages = new Set<number>();
                      passedSessionsInJuz.forEach(s => {
                        getPagesFromSession(s).forEach(p => uniquePages.add(p));
                      });
                      completionPct = Math.min(100, Math.round((uniquePages.size / totalPagesInJuz) * 100));
                    }

                    // Average Score
                    const allSessionsThisJuz = sessions.filter(
                      s => getJuzForSession(s) === juz && 
                           (selectedFilterStudent === '' || s.studentId.toString() === selectedFilterStudent) &&
                           (historySubTab === 'setoran' ? s.sessionType === 'setoran_baru' : (s.sessionType === 'murajaah' || s.sessionType?.startsWith('tasmi_') || s.sessionType === 'tasmi'))
                    );
                    const averageScore = allSessionsThisJuz.length > 0
                      ? (allSessionsThisJuz.reduce((sum, s) => sum + s.scoreFinal, 0) / allSessionsThisJuz.length).toFixed(1)
                      : '-';

                    const juzLabel = JUZ_LABELS[juz] ? `Juz ${juz} — ${JUZ_LABELS[juz]}` : `Juz ${juz}`;

                    return (
                      <div key={juz} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Juz Separtor Header */}
                        <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex flex-col">
                            <h4 className="font-extrabold text-sm md:text-base text-slate-800 tracking-tight">{juzLabel}</h4>
                            {showCompletion && historySubTab === 'setoran' && (
                              <div className="flex items-center space-x-2 mt-1.5 w-60">
                                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${completionPct}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-black text-gray-500 whitespace-nowrap">{completionPct}% Tuntas</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2.5">
                            {showCompletion && completionPct === 100 && (
                              <>
                                {!examRequest && (
                                  <button
                                    type="button"
                                    onClick={() => handleRequestJuziyahExam(selectedFilterStudent, juz)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all uppercase tracking-wide cursor-pointer border-none"
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                    Ajukan Ujian Juziyah
                                  </button>
                                )}
                                {examRequest?.status === 'pending' && (
                                  <span className="text-xs font-black uppercase bg-indigo-50 text-indigo-800 border border-indigo-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                                    <Clock className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                    Menunggu Ujian
                                  </span>
                                )}
                                {examRequest?.status === 'lulus' && (
                                  <span className="text-xs font-black uppercase bg-emerald-50 text-emerald-805 border border-emerald-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Lulus Ujian
                                  </span>
                                )}
                                {examRequest?.status === 'mengulang' && (
                                  <button
                                    type="button"
                                    onClick={() => handleRequestJuziyahExam(selectedFilterStudent, juz)}
                                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all uppercase tracking-wide cursor-pointer border-none animate-pulse"
                                  >
                                    <Zap className="w-3.5 h-3.5" />
                                    Ajukan Ulang Ujian
                                  </button>
                                )}
                              </>
                            )}
                            <span className="text-xs font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1 rounded-full">
                              Rata-rata Nilai: {averageScore}
                            </span>
                          </div>
                        </div>

                        {/* Sessions Table inside Juz */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-white border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {selectedFilterStudent === '' && <th className="py-3 px-6">Santri</th>}
                                <th className="py-3 px-6">Tanggal</th>
                                <th className="py-3 px-6">Materi</th>
                                <th className="py-3 px-6">Scope / Jenis</th>
                                <th className="py-3 px-6 text-center">Skor</th>
                                <th className="py-3 px-6 text-center">Status</th>
                                <th className="py-3 px-6 text-center">Replay Sesi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                              {sessionsInJuz.map((log) => {
                                const sObj = students.find(s => s.id === log.studentId);
                                const formattedDate = new Date(log.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                });

                                return (
                                  <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                                    {selectedFilterStudent === '' && (
                                      <td className="py-3 px-6 font-bold text-gray-900">{sObj?.name || `Santri #${log.studentId}`}</td>
                                    )}
                                    <td className="py-3 px-6 text-gray-400 font-bold">
                                      <div className="flex items-center space-x-1">
                                        <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                        <span>{formattedDate}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-6 text-gray-800">
                                      {log.pageNumber ? (
                                        <span>Halaman {log.pageNumber}</span>
                                      ) : log.startPage ? (
                                        <span>Halaman {log.startPage}–{log.endPage}</span>
                                      ) : log.surahId ? (
                                        <span>Surah {log.surahId}</span>
                                      ) : log.juzId ? (
                                        <span>Juz {log.juzId}</span>
                                      ) : (
                                        <span>—</span>
                                      )}
                                    </td>
                                    <td className="py-3 px-6">
                                      {log.juzId ? (
                                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-700 uppercase">
                                          {log.setoranScope === 'tasmi_juz' ? "Tasmi' 1 Juz" : 
                                          (log.setoranScope === 'three_quarter_juz' ? "Murajaah 3/4 Juz" :
                                          (log.setoranScope === 'half_juz' ? "Murajaah 1/2 Juz" :
                                          (log.setoranScope === 'quarter_juz' ? "Murajaah 1/4 Juz" :
                                          (log.setoranScope === 'halaman' ? `Hal. ${log.pageNumber}` : `Hal. ${log.startPage}-${log.endPage}`))))}
                                        </span>
                                      ) : log.surahId ? (
                                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-50 text-purple-700 uppercase">
                                          Ayat {log.startAyah}-{log.endAyah}
                                        </span>
                                      ) : (
                                        <span className="text-gray-450">—</span>
                                      )}
                                    </td>
                                    <td className="py-3 px-6 text-center font-black text-gray-900">{log.scoreFinal}</td>
                                    <td className="py-3 px-6 text-center">
                                      <span className={cn(
                                        "inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                        log.status === 'lulus' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
                                      )}>
                                        {log.status}
                                      </span>
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                      <button
                                        onClick={() => setSelectedLog(log)}
                                        className="inline-flex items-center space-x-1 py-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-all hover:scale-[1.03]"
                                      >
                                        <span>Replay Mushaf</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* TAB: TASMI HISTORY */}
          {activeTab === 'tasmi' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Filter controls */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">Filter Riwayat Tasmi':</span>
                </div>
                <select
                  value={selectedFilterStudent}
                  onChange={(e) => setSelectedFilterStudent(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">Semua Santri</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="py-4 px-6">Santri</th>
                        <th className="py-4 px-6">Tanggal</th>
                        <th className="py-4 px-6">Materi</th>
                        <th className="py-4 px-6">Jenis Tasmi'</th>
                        <th className="py-4 px-6 text-center">Skor</th>
                        <th className="py-4 px-6 text-center">Status</th>
                        <th className="py-4 px-6 text-center">Replay Sesi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                      {(() => {
                        const tasmiSessions = sessions.filter(s => s.sessionType?.startsWith('tasmi_'));
                        const filteredSessions = selectedFilterStudent
                          ? tasmiSessions.filter(s => s.studentId.toString() === selectedFilterStudent)
                          : tasmiSessions;

                        if (filteredSessions.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-gray-400">Tidak ada riwayat Tasmi' ditemukan.</td>
                            </tr>
                          );
                        }

                        return filteredSessions.map((log) => {
                          const sObj = students.find(s => s.id === log.studentId);
                          const formattedDate = new Date(log.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          });

                          return (
                            <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                              <td className="py-4 px-6 font-bold text-gray-900">{sObj?.name || `Santri #${log.studentId}`}</td>
                              <td className="py-4 px-6 text-xs text-gray-400 font-bold">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                  <span>{formattedDate}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-gray-800">
                                {log.juzId ? (
                                  <span>Juz {log.juzId}</span>
                                ) : (
                                  <span>Surah {log.surahId}</span>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 uppercase">
                                  {log.sessionType === 'tasmi_mandiri' ? "Mandiri" : "Dengan Teman"}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center font-black text-gray-900">{log.scoreFinal}</td>
                              <td className="py-4 px-6 text-center">
                                <span className={cn(
                                  "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                  log.status === 'lulus' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
                                )}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <button
                                  onClick={() => setSelectedLog(log)}
                                  className="inline-flex items-center space-x-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.03]"
                                >
                                  <span>Replay Mushaf</span>
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LEDGER NILAI */}
          {activeTab === 'ledger' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden flex flex-col">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Ledger Nilai Santri</h3>
                    <p className="text-sm text-gray-500 font-medium">Rekapitulasi rata-rata pencapaian hafalan per Juz</p>
                  </div>
                  <div className="flex items-center space-x-4 text-xs font-bold text-gray-500">
                    <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span>Sangat Baik (&gt;80)</span></div>
                    <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span>Cukup (60-80)</span></div>
                    <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span><span>Kurang (&lt;60)</span></div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 font-extrabold sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 border-b border-gray-200 min-w-[200px] sticky left-0 bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nama Santri</th>
                        <th className="px-4 py-3 border-b border-gray-200 min-w-[120px]">Target Juz</th>
                        <th className="px-4 py-3 border-b border-gray-200 min-w-[100px] text-center">Progress</th>
                        {Array.from({ length: 30 }, (_, i) => i + 1).map(juz => (
                          <th key={juz} className="px-3 py-3 border-b border-l border-gray-200 text-center min-w-[60px]">Jz {juz}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(student => {
                        const studentSessions = sessions.filter(s => s.studentId === student.id && s.juzId);
                        const juzScores: Record<number, number[]> = {};
                        studentSessions.forEach(s => {
                          if (!juzScores[s.juzId]) juzScores[s.juzId] = [];
                          juzScores[s.juzId].push(s.scoreFinal);
                        });

                        const juzAverages: Record<number, number> = {};
                        Object.entries(juzScores).forEach(([juzStr, scores]) => {
                          const juz = parseInt(juzStr);
                          const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                          juzAverages[juz] = avg;
                        });

                        // Calculate detailed page-level progress within target Juzes
                        const targetJuzs = student.level?.juzList
                          ? student.level.juzList
                              .split(',')
                              .map((x: string) => parseInt(x.trim()))
                              .filter((x: number) => !isNaN(x))
                          : [];

                        const activeTargetJuzs = targetJuzs.length > 0 ? targetJuzs : Array.from({ length: 30 }, (_, i) => i + 1);

                        // Gather all passed pages for the student
                        const passedPagesSet = new Set<number>();
                        studentSessions.forEach(s => {
                          if (s.status === 'lulus') {
                            if (s.setoranScope === 'halaman' && s.pageNumber) {
                              passedPagesSet.add(s.pageNumber);
                            } else if (s.startPage && s.endPage) {
                              for (let p = s.startPage; p <= s.endPage; p++) {
                                passedPagesSet.add(p);
                              }
                            }
                          }
                        });

                        let totalPagesTarget = 0;
                        let totalPagesPassed = 0;

                        activeTargetJuzs.forEach((juz: number) => {
                          const bounds = getJuzPageRange(juz);
                          const totalPagesInJuz = bounds.end - bounds.start + 1;
                          totalPagesTarget += totalPagesInJuz;

                          let passedInJuz = 0;
                          for (let p = bounds.start; p <= bounds.end; p++) {
                            if (passedPagesSet.has(p)) {
                              passedInJuz++;
                            }
                          }
                          totalPagesPassed += passedInJuz;
                        });

                        const targetJuzCount = activeTargetJuzs.length;
                        const progressPct = totalPagesTarget > 0 ? Math.round((totalPagesPassed / totalPagesTarget) * 100) : 0;

                        return (
                          <tr key={student.id} className="bg-white border-b border-gray-100 hover:bg-emerald-50/30 transition-colors group">
                            <td 
                              className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-white group-hover:bg-emerald-50/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] cursor-pointer hover:text-emerald-700 transition-colors"
                              onClick={() => {
                                setSelectedFilterStudent(student.id.toString());
                                setActiveTab('history');
                              }}
                              title="Klik untuk melihat detail rincian setoran dan nilai"
                            >
                              <div className="flex items-center space-x-1.5">
                                <span>{student.name}</span>
                                <ChevronRight className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
                              </div>
                              <div className="text-[10px] text-gray-400 font-semibold">{student.nis}</div>
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-gray-600">
                              {student.level?.name || 'Reguler'} ({targetJuzCount} Jz)
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[50px]">
                                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, progressPct)}%` }}></div>
                                </div>
                                <span className="text-[10px] font-black text-gray-600 w-6">{progressPct}%</span>
                              </div>
                            </td>
                            {Array.from({ length: 30 }, (_, i) => i + 1).map(juz => {
                              const score = juzAverages[juz];
                              let colorClass = "text-gray-300"; // Empty
                              let bgClass = "";
                              if (score !== undefined) {
                                if (score >= scoringConfig.passThreshold) {
                                  colorClass = "text-emerald-700 font-black";
                                  bgClass = "bg-emerald-100";
                                } else if (score >= 60) {
                                  colorClass = "text-amber-700 font-black";
                                  bgClass = "bg-amber-100";
                                } else {
                                  colorClass = "text-red-700 font-black";
                                  bgClass = "bg-red-100";
                                }
                              }

                              return (
                                <td key={juz} className="px-2 py-2 border-l border-gray-100 text-center">
                                  {score !== undefined ? (
                                    <div className={cn("inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs", colorClass, bgClass)}>
                                      {score}
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center justify-center w-8 h-8 text-gray-200 text-xs">-</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      {students.length === 0 && (
                        <tr>
                          <td colSpan={33} className="px-4 py-12 text-center text-gray-400 text-sm font-medium">
                            Belum ada data santri di halaqah ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BUKU PENGHUBUNG */}
          {activeTab === 'komunikasi' && (
            <div className="flex flex-col md:flex-row gap-6 h-[70vh] animate-fadeIn">
              {/* Student List */}
              <div className="w-full md:w-1/3 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-slate-50">
                  <h3 className="font-extrabold text-gray-900">Pilih Wali Santri</h3>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 p-2">
                  {students.map(student => (
                    <button
                      key={student.id}
                      onClick={() => setChatStudentId(student.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl transition-all cursor-pointer",
                        chatStudentId === student.id ? "bg-emerald-50 text-emerald-900" : "hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      <p className="font-bold text-sm">{student.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Level: {student.level?.name || '-'}</p>
                    </button>
                  ))}
                  {students.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-400">Belum ada santri</div>
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="w-full md:w-2/3 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
                {chatStudentId ? (
                  <>
                    <div className="p-4 border-b border-gray-100 bg-emerald-50/30">
                      <h2 className="text-lg font-black text-emerald-950">
                        Buku Penghubung: {students.find(s => s.id === chatStudentId)?.name}
                      </h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">Berkomunikasi dengan wali santri</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                      {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm font-bold text-gray-400">
                          Belum ada pesan. Mulai percakapan sekarang.
                        </div>
                      ) : (
                        messages.map((msg, idx) => {
                          const isMe = msg.senderId === user?.id;
                          return (
                            <div key={idx} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                              <div className={cn(
                                "max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                                isMe ? "bg-emerald-600 text-white rounded-tr-sm" : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
                              )}>
                                <p className={cn("text-[10px] font-bold mb-1 opacity-80", isMe ? "text-emerald-100" : "text-gray-400")}>
                                  {isMe ? "Anda (Ustadz)" : (msg.sender?.name || 'Wali Santri')} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="leading-relaxed">{msg.content}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t border-gray-100">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input 
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Tulis pesan..."
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button 
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm cursor-pointer"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                    Pilih wali santri di samping untuk memulai chat
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: MURAJAAH DI RUMAH */}
          {activeTab === 'home_murajaah' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Form Penugasan */}
                <div className="w-full lg:w-1/3 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 shrink-0 h-fit">
                  <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    Beri Tugas Harian
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mb-6">Tugaskan muraja'ah mandiri santri di rumah</p>

                  <form onSubmit={handleAssignHomeMurajaah} className="space-y-4.5">
                    {/* Mode Penugasan Toggle */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-2">Penerima Tugas</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        <button
                          type="button"
                          onClick={() => setHomeAssignMode('perorang')}
                          className={cn(
                            "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                            homeAssignMode === 'perorang' ? "bg-white text-emerald-950 shadow-sm" : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          Perorang
                        </button>
                        <button
                          type="button"
                          onClick={() => setHomeAssignMode('perhalaqah')}
                          className={cn(
                            "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                            homeAssignMode === 'perhalaqah' ? "bg-white text-emerald-950 shadow-sm" : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          Perhalaqah
                        </button>
                      </div>
                    </div>

                    {/* Penerima Selector */}
                    {homeAssignMode === 'perorang' ? (
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1.5">Pilih Santri</label>
                        <select
                          value={homeSelectedStudent}
                          onChange={(e) => setHomeSelectedStudent(e.target.value)}
                          className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 font-semibold cursor-pointer"
                        >
                          <option value="">-- Pilih Santri --</option>
                          {students.map((student: any) => (
                            <option key={student.id} value={student.id}>{student.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1.5">Pilih Halaqah</label>
                        <select
                          value={homeSelectedHalaqah}
                          onChange={(e) => setHomeSelectedHalaqah(e.target.value)}
                          className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 font-semibold cursor-pointer"
                        >
                          <option value="">-- Pilih Halaqah --</option>
                          {halaqahs.map((halaqah: any) => (
                            <option key={halaqah.id} value={halaqah.id}>{halaqah.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Hari / Tanggal */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1.5">Tanggal Penugasan</label>
                      <input
                        type="date"
                        value={homeDate}
                        onChange={(e) => setHomeDate(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 font-bold"
                      />
                    </div>

                    {/* Shift */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1.5">Waktu Muraja'ah (Shift)</label>
                      <select
                        value={homeShift}
                        onChange={(e) => setHomeShift(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 font-bold cursor-pointer"
                      >
                        <option value="Subuh">Subuh</option>
                        <option value="Magrib">Maghrib</option>
                      </select>
                    </div>

                    {/* Target Type Toggle */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-2">Jenis Target</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        <button
                          type="button"
                          onClick={() => setHomeTargetType('Surat')}
                          className={cn(
                            "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                            homeTargetType === 'Surat' ? "bg-white text-emerald-950 shadow-sm" : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          Surah
                        </button>
                        <button
                          type="button"
                          onClick={() => setHomeTargetType('Juz')}
                          className={cn(
                            "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                            homeTargetType === 'Juz' ? "bg-white text-emerald-950 shadow-sm" : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          Juz
                        </button>
                      </div>
                    </div>

                    {/* Target Name (Multi-select Dropdowns) */}
                    <div className="relative">
                      <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1.5">
                        {homeTargetType === 'Surat' ? 'Pilih Surah (Bisa Lebih dari Satu)' : 'Pilih Nomor Juz'}
                      </label>
                      
                      {homeTargetType === 'Surat' ? (
                        <div>
                          {/* Trigger Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsSurahDropdownOpen(!isSurahDropdownOpen);
                              setIsJuzDropdownOpen(false);
                            }}
                            className="w-full min-h-[46px] bg-slate-50 border border-gray-200 hover:border-emerald-300 rounded-2xl px-4 py-2.5 text-sm text-left text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 flex flex-wrap gap-1 items-center justify-between cursor-pointer"
                          >
                            <div className="flex flex-wrap gap-1.5 max-w-[90%]">
                              {selectedHomeSurahs.length === 0 ? (
                                <span className="text-gray-400">-- Pilih Surah --</span>
                              ) : (
                                selectedHomeSurahs.map(sid => {
                                  const sName = surahs.find(s => s.id === sid)?.nameEn || `Surah ${sid}`;
                                  return (
                                    <span key={sid} className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                                      {sName}
                                      <span
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleHomeSurahSelection(sid);
                                        }}
                                        className="hover:bg-emerald-200/60 rounded px-0.5 text-xs text-emerald-950 font-sans cursor-pointer"
                                      >
                                        ×
                                      </span>
                                    </span>
                                  );
                                })
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400">▼</span>
                          </button>

                          {/* Popover Panel */}
                          {isSurahDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-2 z-50 bg-white border border-gray-150 rounded-2xl shadow-xl p-3 flex flex-col gap-2 max-h-[300px]">
                              <input
                                type="text"
                                value={surahSearchText}
                                onChange={(e) => setSurahSearchText(e.target.value)}
                                placeholder="Cari Surah..."
                                className="w-full bg-slate-50 border border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                              />
                              <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-[180px] scrollbar-thin">
                                {surahs
                                  .filter(s => s.nameEn.toLowerCase().includes(surahSearchText.toLowerCase()))
                                  .map(s => {
                                    const isChecked = selectedHomeSurahs.includes(s.id);
                                    return (
                                      <label
                                        key={s.id}
                                        className="flex items-center gap-3 py-2 px-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => toggleHomeSurahSelection(s.id)}
                                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                                        />
                                        <div className="flex-1 flex justify-between items-center text-xs">
                                          <span className="font-bold text-gray-800">{s.nameEn}</span>
                                          <span className="quran-text font-bold text-emerald-950">{s.nameAr}</span>
                                        </div>
                                      </label>
                                    );
                                  })}
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsSurahDropdownOpen(false)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer"
                              >
                                Selesai
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          {/* Trigger Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsJuzDropdownOpen(!isJuzDropdownOpen);
                              setIsSurahDropdownOpen(false);
                            }}
                            className="w-full min-h-[46px] bg-slate-50 border border-gray-200 hover:border-emerald-300 rounded-2xl px-4 py-2.5 text-sm text-left text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 flex flex-wrap gap-1 items-center justify-between cursor-pointer"
                          >
                            <div className="flex flex-wrap gap-1.5 max-w-[90%]">
                              {selectedHomeJuzs.length === 0 ? (
                                <span className="text-gray-400">-- Pilih Juz --</span>
                              ) : (
                                selectedHomeJuzs.map(j => (
                                  <span key={j} className="bg-sky-50 text-sky-800 text-[10px] font-black px-2 py-0.5 rounded-lg border border-sky-100 flex items-center gap-1">
                                    Juz {j}
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleHomeJuzSelection(j);
                                      }}
                                      className="hover:bg-sky-200/60 rounded px-0.5 text-xs text-sky-950 font-sans cursor-pointer"
                                    >
                                      ×
                                    </span>
                                  </span>
                                ))
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400">▼</span>
                          </button>

                          {/* Popover Panel */}
                          {isJuzDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-2 z-50 bg-white border border-gray-150 rounded-2xl shadow-xl p-3 flex flex-col gap-2 max-h-[300px]">
                              <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-[200px] scrollbar-thin">
                                {Array.from({ length: 30 }, (_, i) => i + 1).map(j => {
                                  const isChecked = selectedHomeJuzs.includes(j);
                                  return (
                                    <label
                                      key={j}
                                      className="flex items-center gap-3 py-2 px-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleHomeJuzSelection(j)}
                                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-gray-300"
                                      />
                                      <div className="flex-1 flex justify-between items-center text-xs">
                                        <span className="font-bold text-gray-800">Juz {j}</span>
                                        <span className="text-[10px] text-gray-400 font-bold">{JUZ_LABELS[j] || ''}</span>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsJuzDropdownOpen(false)}
                                className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer"
                              >
                                Selesai
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={assignHomeMurajaahMutation.isPending}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-2xl transition-all duration-150 flex items-center justify-center gap-2 shadow-md shadow-emerald-700/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {assignHomeMurajaahMutation.isPending ? 'Mengirim Tugas...' : 'Tugaskan Santri'}
                    </button>
                  </form>
                </div>

                {/* Live Report */}
                <div className="flex-1 w-full">
                  <MutabaahMurojaahReport />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SESSION REPLAY MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest bg-emerald-100 text-emerald-800 uppercase mb-1.5">
                  REPLAY SESI SETORAN
                </span>
                <h3 className="text-lg font-black text-gray-900">
                  {students.find(s => s.id === selectedLog.studentId)?.name || 'Detail Sesi'}
                </h3>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                  {selectedLog.juzId ? (
                    `Materi Juz ${selectedLog.juzId} • ${
                      selectedLog.setoranScope === 'tasmi_juz' ? 'Tasmi 1 Juz' :
                      selectedLog.setoranScope === 'three_quarter_juz' ? 'Murajaah 3/4 Juz' :
                      selectedLog.setoranScope === 'half_juz' ? 'Murajaah 1/2 Juz' :
                      selectedLog.setoranScope === 'quarter_juz' ? 'Murajaah 1/4 Juz' :
                      (selectedLog.setoranScope === 'halaman' ? `Halaman ${selectedLog.pageNumber}` : `Halaman ${selectedLog.startPage}-${selectedLog.endPage}`)
                    }`
                  ) : (
                    `Materi Surah ${selectedLog.surahId} (Ayat ${selectedLog.startAyah}-${selectedLog.endAyah})`
                  )}
                  {" • "}{new Date(selectedLog.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedLog(null);
                  setLogQuran(null);
                  setSelectedReplayError(null);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Session Meta Stats */}
              <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                <div>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Skor Akhir</p>
                  <p className="text-xl font-black text-gray-800 mt-0.5">{selectedLog.scoreFinal}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Jali (Fatal)</p>
                  <p className="text-xl font-black text-red-650 mt-0.5">{selectedLog.errorJaliCount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Khafi (Tajwid)</p>
                  <p className="text-xl font-black text-orange-600 mt-0.5">{selectedLog.errorKhafiCount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Tark (Lupa)</p>
                  <p className="text-xl font-black text-gray-500 mt-0.5">{selectedLog.errorTarkCount}</p>
                </div>
              </div>

              {/* Quran Text Replay */}
              {selectedReplayError && (
              <div className="mb-6 animate-fadeIn">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-gray-805 text-sm">Replika Kesalahan Pada Lembaran Mushaf:</h4>
                  <button onClick={() => setSelectedReplayError(null)} className="text-[10px] text-red-500 hover:text-red-700 font-bold px-2.5 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-all">Tutup Replika</button>
                </div>
                {logQuran ? (
                  <div className="relative bg-[#fbf9f4] rounded-2xl shadow-md border-2 border-emerald-800/80 p-6 max-h-[400px] overflow-y-auto overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-36 h-36 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

                    <div
                      className="relative text-justify quran-text drop-shadow-sm leading-loose"
                      style={{ fontSize: '24px', lineHeight: 2.6 }}
                      dir="rtl"
                    >
                      {logQuran.ayahs.filter((ayah: any) => ayah.ayah_id === selectedReplayError.ayahId && (ayah.surahId || logQuran.surah_id) === selectedReplayError.surahId).map((ayah: any) => {
                        const isFirstAyahOfSurah = ayah.ayah_id === 1;
                        const isSurah1 = ayah.surahId === 1;
                        const isSurah9 = ayah.surahId === 9;

                        const hasBismillahPrefix = isFirstAyahOfSurah && !isSurah1 && !isSurah9 && ayah.words && ayah.words.length >= 4 &&
                          (ayah.words[0].text.includes("بِسْمِ") || ayah.words[0].text.includes("بسم"));

                        if (isSurah1 && isFirstAyahOfSurah) {
                          return (
                            <React.Fragment key={ayah.id}>
                              {/* Surah Start Banner */}
                              <div className="w-full text-center my-4 select-none block" dir="ltr">
                                <div className="inline-block w-full max-w-sm bg-gradient-to-r from-emerald-800/10 via-emerald-850/5 to-emerald-800/10 border-y border-emerald-800/20 py-2 px-4 rounded-md">
                                  <h3 className="font-serif font-black text-emerald-950 text-lg quran-text">
                                    {surahs.find(s => s.id === ayah.surahId)?.nameAr || 'سورة الفاتحة'}
                                  </h3>
                                  <p className="text-[9px] uppercase font-extrabold tracking-widest text-emerald-800 mt-0.5">
                                    Surah {surahs.find(s => s.id === ayah.surahId)?.nameEn || 'Al-Fatihah'}
                                  </p>
                                </div>
                              </div>

                              {/* Centered Bismillah for Surah 1 Ayah 1 */}
                              <div className="w-full text-center my-4 block font-serif font-semibold text-emerald-950/95 leading-normal select-none" dir="rtl">
                                {ayah.words.map((word: any) => {
                                  const bm = selectedLog.errors?.find((b: any) => b.surahId === ayah.surahId && b.ayahId === ayah.ayah_id && b.wordIndex === word.id);
                                  const et = bm?.errorType;
                                  return (
                                    <React.Fragment key={word.id}>
                                      <span className={cn(
                                        'px-0.5 rounded select-none',
                                        et === 'jali' && 'bg-red-50 text-red-700 font-bold border-b-2 border-red-400',
                                        et === 'khafi' && 'bg-orange-50 text-orange-700 font-semibold border-b-2 border-orange-400',
                                        et === 'tark' && 'bg-gray-100 text-gray-600 opacity-80 border-b-2 border-gray-400',
                                      )}>
                                        {word.text}
                                      </span>
                                      {" "}
                                    </React.Fragment>
                                  );
                                })}
                                {/* Ayah end marker */}
                                <span className="inline-flex items-center justify-center mx-1 text-emerald-600 font-sans text-base opacity-80 select-none">
                                  ۝<span className="absolute text-[9px] font-bold pt-1">{ayah.ayah_id}</span>
                                </span>
                              </div>
                            </React.Fragment>
                          );
                        }

                        const renderedWords = hasBismillahPrefix ? ayah.words.slice(4) : (ayah.words || []);

                        return (
                          <React.Fragment key={ayah.id}>
                            {/* Surah start banner */}
                            {isFirstAyahOfSurah && (
                              <div className="w-full text-center my-4 select-none block" dir="ltr">
                                <div className="inline-block w-full max-w-sm bg-gradient-to-r from-emerald-800/10 via-emerald-850/5 to-emerald-800/10 border-y border-emerald-800/20 py-2 px-4 rounded-md">
                                  <h3 className="font-serif font-black text-emerald-950 text-lg quran-text">
                                    {surahs.find(s => s.id === ayah.surahId)?.nameAr || 'سورة'}
                                  </h3>
                                  <p className="text-[9px] uppercase font-extrabold tracking-widest text-emerald-800 mt-0.5">
                                    Surah {surahs.find(s => s.id === ayah.surahId)?.nameEn || ''}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Centered Bismillah Header for other Surahs */}
                            {hasBismillahPrefix && (
                              <div className="w-full text-center my-4 block font-serif font-semibold text-emerald-950/95 leading-normal select-none" dir="rtl">
                                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                              </div>
                            )}

                            {/* Words */}
                            {renderedWords.map((word: any) => {
                              const bm = selectedLog.errors?.find((b: any) => b.surahId === ayah.surahId && b.ayahId === ayah.ayah_id && b.wordIndex === word.id);
                              const et = bm?.errorType;
                              return (
                                <React.Fragment key={word.id}>
                                  <span className={cn(
                                    'px-0.5 rounded select-none',
                                    et === 'jali' && 'bg-red-50 text-red-700 font-bold border-b-2 border-red-400',
                                    et === 'khafi' && 'bg-orange-50 text-orange-700 font-semibold border-b-2 border-orange-400',
                                    et === 'tark' && 'bg-gray-100 text-gray-600 opacity-80 border-b-2 border-gray-400',
                                  )}>
                                    {word.text}
                                  </span>
                                  {" "}
                                </React.Fragment>
                              );
                            })}

                            {/* Ayah Marker */}
                            <span className="inline-flex items-center justify-center mx-1 text-emerald-600 font-sans text-base opacity-80 select-none">
                              ۝<span className="absolute text-[9px] font-bold pt-1">{ayah.ayah_id}</span>
                            </span>
                            {" "}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 text-sm">Memuat teks Al-Qur'an...</div>
                )}
              </div>
              )}

              {/* Rincian dan Letak Kesalahan Kata List */}
              {selectedLog.errors && selectedLog.errors.length > 0 && (
                <div className="space-y-2.5 mb-6">
                  <h4 className="font-bold text-gray-805 text-sm">Daftar Rincian & Letak Kesalahan Kata:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedLog.errors.map((err: any, idx: number) => (
                      <div key={idx} onClick={() => setSelectedReplayError(err)} className={cn("flex flex-col border p-3 rounded-xl text-xs cursor-pointer transition-all hover:scale-[1.01]", selectedReplayError === err ? "bg-emerald-50 border-emerald-300 shadow-sm" : "bg-gray-50 border-gray-200 hover:bg-emerald-50/50 hover:border-emerald-200")} dir="ltr">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              'w-2 h-2 rounded-full flex-shrink-0',
                              err.errorType === 'jali' ? 'bg-red-500' : err.errorType === 'khafi' ? 'bg-orange-500' : 'bg-gray-500'
                            )} />
                            <div>
                              <p className="font-bold text-gray-700 text-[11px]">
                                {surahs.find(s => s.id === err.surahId)?.nameEn || `Surah ${err.surahId}`} : Ayat {err.ayahId}
                              </p>
                              <p className="text-[8px] text-gray-400 font-extrabold uppercase">
                                {err.errorType === 'jali' ? 'Jali (Fatal)' : err.errorType === 'khafi' ? 'Khafi (Tajwid)' : 'Tark (Lupa)'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-2" dir="rtl">
                            <span className="quran-text text-base font-bold text-emerald-955">"{err.wordTextAr || '—'}"</span>
                          </div>
                        </div>
                        {err.note && (
                          <div className="mt-2 pt-2 border-t border-gray-200/60 text-[10px] text-emerald-800 font-medium bg-emerald-50/50 px-2 py-1 rounded-lg">
                            <span className="font-bold">Catatan:</span> {err.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ustadz notes */}
              {selectedLog.notesUstadz && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 animate-fadeIn">
                  <h4 className="font-bold text-emerald-955 text-sm mb-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1.5" /> Catatan Masukan Pengajar:
                  </h4>
                  <p className="text-emerald-900 text-sm leading-relaxed">{selectedLog.notesUstadz}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DRAFT RECOVERY MODAL */}
      {showDraftModal && draftToRecover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 p-6 flex flex-col items-center text-center animate-scaleUp">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <History className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Sesi Talaqqi Terputus</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Ditemukan draf sesi talaqqi aktif untuk santri{" "}
              <span className="font-extrabold text-slate-900">
                {students.find((s) => s.id.toString() === draftToRecover.selectedStudent)?.name || 'Santri'}
              </span>{" "}
              yang belum selesai disimpan. Apakah Anda ingin melanjutkan sesi tersebut?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={handleRestoreDraft}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all duration-150 shadow-md shadow-emerald-600/15"
              >
                Pulihkan Sesi
              </button>
              <button
                onClick={handleDiscardDraft}
                className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-200 transition-all duration-150"
              >
                Abaikan & Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
