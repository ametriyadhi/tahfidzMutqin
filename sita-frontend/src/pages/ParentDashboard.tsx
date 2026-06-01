// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { LogOut, BookOpen, Flame, ChevronRight, ChevronLeft, Users, Share2, Send, X, AlertCircle, Sparkles, Trophy, Award, Printer, BarChart3, MessageSquare, LayoutDashboard, Clock, Key } from 'lucide-react';
import { NotificationCenter } from '../components/NotificationCenter';
import { useBranding } from '../context/BrandingContext';
import { QURAN_PAGE_MAPPINGS } from '../lib/pageMappings';
import { calculateSpacedRepetition, calculateBadges } from '../lib/talaqqiUtils';
import {
  useParentStudents,
  useSurahs,
  useStudentProgress,
  useSessions,
  useStudentHeatmap,
  useMessages,
  useCertificates,
  useSendMessage,
  useParentHomeAssignments,
  useSubmitHomeFeedback
} from '../hooks/useQueries';
import { HeaderOnlyFallback } from '../components/LoadingFallback';
import { SitaActivitiesSlider } from '../components/SitaActivitiesSlider';

const getJuzPageRange = (juz: number) => {
  if (juz === 1) return { start: 1, end: 21 };
  if (juz === 30) return { start: 582, end: 604 };
  
  const start = 22 + (juz - 2) * 20;
  const end = start + 19;
  return { start, end };
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

export const ParentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = api.getUser();
  const { appName, appLogo, setPageTitle } = useBranding();
  
  const { data: children = [], isLoading: isChildrenLoading } = useParentStudents();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  // ── All UI state — must come BEFORE any conditional return ────────────────
  const [logQuran, setLogQuran] = useState<any>(null);
  const [selectedReplayError, setSelectedReplayError] = useState<any>(null);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const [historyTab, setHistoryTab] = useState<'setoran' | 'murajaah'>('setoran');

  // ═══ TanStack Query — data fetching with caching ═══
  const selectedChild = children.find((c: any) => c.id === selectedChildId);
  
  const { data: stats } = useStudentProgress(selectedChildId || 0);
  const { data: allSessions = [] } = useSessions();
  const sessions = React.useMemo(() => allSessions.filter((s: any) => s.studentId === selectedChildId), [allSessions, selectedChildId]);
  
  const { data: heatmap = [] } = useStudentHeatmap(selectedChildId || 0);
  const { data: surahs = [] } = useSurahs();

  // Heatmap State Variables
  const [selectedSurah, setSelectedSurah] = useState<number | ''>('');
  const [selectedPage, setSelectedPage] = useState<number>(604);
  const [hoveredWord, setHoveredWord] = useState<any>(null);
  const [quranData, setQuranData] = useState<any>(null);
  const [heatmapMode, setHeatmapMode] = useState<'surah' | 'page'>('surah');

  const availableJuz = React.useMemo<number[]>(() => {
    if (!selectedChild?.level?.juzList) return Array.from({ length: 30 }, (_, i) => i + 1);
    const parsed = selectedChild.level.juzList.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
    return parsed.length > 0 ? parsed.sort((a: number, b: number) => a - b) : Array.from({ length: 30 }, (_, i) => i + 1);
  }, [selectedChild]);

  const spacedRepetitionPages = React.useMemo(() => {
    return calculateSpacedRepetition(sessions, availableJuz);
  }, [sessions, availableJuz]);

  const badges = React.useMemo(() => {
    return calculateBadges(sessions);
  }, [sessions]);

  const levelProgressPct = React.useMemo(() => {
    const total = availableJuz.reduce((sum, juz) => sum + getTotalPagesInJuz(juz), 0);
    if (total === 0) return 0;
    const uniquePages = new Set<string>();
    sessions.forEach((s) => {
      const juz = getJuzForSession(s);
      if (availableJuz.includes(juz) && s.status === 'lulus' && s.sessionType === 'setoran_baru') {
        getPagesFromSession(s).forEach((p) => {
          uniquePages.add(`${juz}-${p}`);
        });
      }
    });
    return Math.min(100, Math.round((uniquePages.size / total) * 100));
  }, [sessions, availableJuz]);

  // Komunikasi Module
  const [mainTab, setMainTab] = useState<'home' | 'laporan' | 'komunikasi' | 'sertifikat' | 'mushaf_tilawah' | 'home_murajaah'>('home');
  const { data: messages = [] } = useMessages(selectedChildId || 0);
  const { data: certificates = [] } = useCertificates(selectedChildId || 0);
  const sendMessageMutation = useSendMessage();
  const [newMessage, setNewMessage] = useState('');
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ─── PARENT HOME MURAJAAH STATES ───────────────────
  const { data: parentAssignments = [], isLoading: isAssignmentsLoading } = useParentHomeAssignments();
  const submitHomeFeedbackMutation = useSubmitHomeFeedback();

  const [activeAssignmentForFeedback, setActiveAssignmentForFeedback] = useState<any | null>(null);
  const [feedbackIsExecuted, setFeedbackIsExecuted] = useState(true);
  const [feedbackIsTargetMet, setFeedbackIsTargetMet] = useState(true);
  const [feedbackIsFluent, setFeedbackIsFluent] = useState(true);
  const [feedbackSignature, setFeedbackSignature] = useState('');
  const [feedbackNotes, setFeedbackNotes] = useState('');

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignmentForFeedback) return;
    if (!feedbackSignature.trim()) {
      alert("Harap masukkan Tanda Tangan / Nama Orang Tua.");
      return;
    }
    try {
      await submitHomeFeedbackMutation.mutateAsync({
        id: activeAssignmentForFeedback.id,
        data: {
          isExecuted: feedbackIsExecuted,
          isTargetMet: feedbackIsExecuted ? feedbackIsTargetMet : false,
          isFluent: feedbackIsExecuted ? feedbackIsFluent : false,
          parentSignature: feedbackSignature,
          parentNotes: feedbackNotes
        }
      });
      alert("Feedback muraja'ah berhasil dikirim!");
      // Reset
      setActiveAssignmentForFeedback(null);
      setFeedbackSignature('');
      setFeedbackNotes('');
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim feedback');
    }
  };

  // ─── Mushaf Tilawah Orang Tua ───────────────────
  const [tilawahPage, setTilawahPage] = useState<number>(582);
  const [prevPage, setPrevPage] = useState<number>(582);
  const [slideDir, setSlideDir] = useState<'next' | 'prev'>('next');
  const [tilawahLoading, setTilawahLoading] = useState<boolean>(false);
  const [tilawahAyahs, setTilawahAyahs] = useState<any[]>([]);
  const [tilawahSurahNames, setTilawahSurahNames] = useState<Record<number, { nameAr: string; nameEn: string }>>({});
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const getPagesForSurah = (sId: number): number[] => {
    const pages: number[] = [];
    for (const [pageStr, ranges] of Object.entries(QURAN_PAGE_MAPPINGS)) {
      const page = parseInt(pageStr);
      if (ranges.some(r => r.surahId === sId)) {
        pages.push(page);
      }
    }
    return pages.sort((a, b) => a - b);
  };

  useEffect(() => {
    if (tilawahPage > prevPage) {
      setSlideDir('next');
    } else if (tilawahPage < prevPage) {
      setSlideDir('prev');
    }
    setPrevPage(tilawahPage);
  }, [tilawahPage, prevPage]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
    setTouchEnd(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;

    // Hanya picu perpindahan jika swipe horizontal dominan dan melampaui batas (min 60px)
    // dan pergerakan vertikal minimal (maks 40px) agar tidak bentrok dengan scroll vertikal
    const isHorizontalSwipe = Math.abs(deltaX) > 60 && Math.abs(deltaY) < 40;

    if (isHorizontalSwipe) {
      if (deltaX > 0) { // Geser ke kiri -> Halaman berikutnya
        if (tilawahPage < 604) {
          setTilawahPage(prev => prev + 1);
        }
      } else { // Geser ke kanan -> Halaman sebelumnya
        if (tilawahPage > 1) {
          setTilawahPage(prev => prev - 1);
        }
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    if (mainTab !== 'mushaf_tilawah') return;

    const ranges = QURAN_PAGE_MAPPINGS[tilawahPage];
    if (!ranges || ranges.length === 0) return;

    setTilawahLoading(true);

    Promise.all(
      ranges.map((r) => api.getAyahs(r.surahId, r.startAyah, r.endAyah))
    )
      .then((results) => {
        const merged: any[] = [];
        const namesMap: Record<number, { nameAr: string; nameEn: string }> = {};
        results.forEach((res: any) => {
          if (!res) return;
          namesMap[res.surah_id] = { nameAr: res.surah_name_ar, nameEn: res.surah_name_id };
          res.ayahs.forEach((a: any) => {
            merged.push({
              ...a,
              surahId: res.surah_id,
            });
          });
        });
        setTilawahAyahs(merged);
        setTilawahSurahNames((prev) => ({ ...prev, ...namesMap }));
        setTilawahLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat teks tilawah:", err);
        setTilawahLoading(false);
      });
  }, [tilawahPage, mainTab]);

  // Heatmap Helper Functions
  const getHeatmapColor = (count: number) => {
    if (count === 0) return '';
    if (count <= 2) return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border-b-2 border-yellow-300';
    if (count <= 5) return 'bg-orange-100 hover:bg-orange-200 text-orange-900 border-b-2 border-orange-300';
    if (count <= 10) return 'bg-red-100 hover:bg-red-200 text-red-950 border-b-2 border-red-300';
    return 'bg-red-500 hover:bg-red-600 text-white font-bold border-b-2 border-red-700';
  };

  const getWordStats = (surahId: number, ayahId: number, wordIdx: number) =>
    heatmap.find(h => h.surahId === surahId && h.ayahId === ayahId && h.wordIndex === wordIdx);


  useEffect(() => {
    setPageTitle('Dashboard Orang Tua');
  }, [appName]);

  useEffect(() => {
    const currentUser = api.getUser();
    if (!currentUser || currentUser.role !== 'parent') {
      navigate('/login');
      return;
    }
  }, [navigate]);


  // Auto-select first child when data is loaded
  useEffect(() => {
    if (children.length > 0 && selectedChildId === null) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  // Fetch Quran text when selectedSurah, selectedPage, or heatmapMode changes
  useEffect(() => {
    if (heatmapMode === 'surah') {
      if (selectedSurah === '') {
        setQuranData(null);
        return;
      }
      api.getAyahs(selectedSurah, 1, 286).then(setQuranData).catch(console.error);
    } else {
      const ranges = QURAN_PAGE_MAPPINGS[selectedPage];
      if (!ranges || ranges.length === 0) {
        setQuranData(null);
        return;
      }
      Promise.all(
        ranges.map((r) => api.getAyahs(r.surahId, r.startAyah, r.endAyah))
      )
        .then((results) => {
          const mergedAyahs: any[] = [];
          results.forEach((res: any) => {
            if (!res) return;
            res.ayahs.forEach((a: any) => {
              mergedAyahs.push({
                id: a.id,
                ayah_id: a.ayah_id,
                surahId: res.surah_id,
                text: a.text,
                words: a.words,
              });
            });
          });
          setQuranData({
            surah_id: ranges[0].surahId,
            surah_name_ar: 'Halaman ' + selectedPage,
            surah_name_id: 'Halaman ' + selectedPage,
            ayahs: mergedAyahs,
          });
        })
        .catch(console.error);
    }
  }, [selectedSurah, selectedPage, heatmapMode]);

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

  useEffect(() => {
    if (mainTab === 'komunikasi') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, mainTab]);

  // All hooks declared above. Now we can safely do conditional early return.
  if (isChildrenLoading) {
    return <HeaderOnlyFallback />;
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChildId) return;

    sendMessageMutation.mutateAsync({ studentId: selectedChildId, receiverId: null, content: newMessage })
      .then(() => {
        setNewMessage('');
      })
      .catch(console.error);
  };

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  return (
    <div className={cn("min-h-screen font-sans transition-colors duration-300", mainTab === 'mushaf_tilawah' ? "bg-[#fcf8f2] pb-16" : "bg-gray-50 pb-24")}>
      {/* ══ MOBILE FIRST HEADER (On Home Tab Only) ══ */}
      {mainTab === 'home' && (
        <header className="bg-[#064e3b] text-white pt-6 pb-20 px-4 md:px-8 rounded-b-[36px] shadow-md relative overflow-hidden w-full">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {appLogo ? (
                <img src={appLogo} alt={appName} className="h-10 w-auto object-contain rounded-xl border border-white/10" />
              ) : (
                <div className="w-10 h-10 bg-white/20 text-white backdrop-blur-md rounded-xl flex items-center justify-center font-black">
                  S
                </div>
              )}
              <div className="text-left">
                <h1 className="font-extrabold text-[9px] tracking-widest text-emerald-200 uppercase leading-none">{appName} Wali</h1>
                <p className="font-serif font-black text-white text-base mt-0.5 leading-none">An Nahl Islamic School</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <NotificationCenter />
              <button
                onClick={handleLogout}
                className="p-2 bg-white/10 hover:bg-white/25 rounded-full text-white backdrop-blur-md transition-all shadow-sm cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Child Glass Capsule Dropdown & Profile info */}
          <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <span className="text-[8px] uppercase font-black tracking-widest text-emerald-200">Pilih Ananda:</span>
              <div className="relative">
                <select
                  value={selectedChildId || ''}
                  onChange={(e) => setSelectedChildId(e.target.value ? Number(e.target.value) : null)}
                  className="bg-emerald-950/20 text-white font-extrabold border-0 rounded-xl pl-2 pr-6 py-0.5 text-xs focus:outline-none cursor-pointer appearance-none outline-none font-sans"
                >
                  {children.map((c) => (
                    <option key={c.id} value={c.id} className="text-gray-800 font-bold bg-white">
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none text-white/70 text-[9px]">▼</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[8px] uppercase font-black tracking-widest text-emerald-200">Wali Santri:</span>
              <p className="text-xs font-extrabold text-white mt-0.5 truncate max-w-[120px]">{user?.name}</p>
            </div>
          </div>
        </header>
      )}

      {/* ══ FLOATING KEMBALI HEADER (On Feature Tabs Only) ══ */}
      {mainTab !== 'home' && (
        <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-3 sticky top-0 z-30 shadow-sm flex items-center justify-between w-full">
          <button
            onClick={() => setMainTab('home')}
            className="flex items-center space-x-2 text-emerald-800 font-bold hover:text-emerald-950 transition-colors cursor-pointer bg-transparent border-0 outline-none"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-black uppercase tracking-wider">Kembali ke Beranda</span>
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-gray-400 text-right">
            {mainTab === 'laporan' && "MUTABA'AH & RAPOR"}
            {mainTab === 'mushaf_tilawah' && "MUSHAF TILAWAH"}
            {mainTab === 'sertifikat' && "SERTIFIKAT EMAS"}
            {mainTab === 'komunikasi' && "BUKU PENGHUBUNG"}
            {mainTab === 'home_murajaah' && "MURAJA'AH DI RUMAH"}
          </span>
        </div>
      )}

      {/* ══ PORTAL HOME (MOBILE FIRST PORTAL) ══ */}
      {mainTab === 'home' && (
        <main className="w-full -mt-12 px-4 md:px-8 pb-24 z-20 relative animate-fadeIn">
          <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start space-y-6 md:space-y-0">
            {/* Left Column: Progress, Grid Menu, Tagihan */}
            <div className="space-y-6">
              {/* Anak Summary & Progress Card */}
              {selectedChildId !== null && selectedChild && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1 text-left flex-1 min-w-0">
                      <span className="text-[9px] uppercase font-black tracking-widest text-emerald-600 block">Level Target Hafalan</span>
                      <h3 className="text-base font-black text-gray-800 tracking-tight leading-tight truncate">{selectedChild.level?.name || '—'}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{selectedChild.level?.juzCount || 0} Juz Target</p>
                    </div>
                    
                    {/* SVG Progress Circle */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-20 h-20 relative bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full shadow-md">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="26" className="text-white/10" strokeWidth="5" stroke="currentColor" fill="transparent" />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          className="text-white transition-all duration-1000 ease-out"
                          strokeWidth="5"
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={2 * Math.PI * 26 - (levelProgressPct / 100) * (2 * Math.PI * 26)}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-black text-white leading-none">{levelProgressPct}%</span>
                        <span className="text-[6px] font-black text-emerald-100 uppercase tracking-widest mt-0.5">Selesai</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic stats row */}
                  <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-3">
                    <div className="text-center">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Streak</span>
                      <span className="text-sm font-black text-orange-605 block mt-0.5">{stats?.currentStreak || 0} Hari</span>
                    </div>
                    <div className="text-center border-x border-gray-100">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Total Sesi</span>
                      <span className="text-sm font-black text-emerald-800 block mt-0.5">{stats?.totalSessions || 0}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Kelulusan</span>
                      <span className="text-sm font-black text-indigo-700 block mt-0.5">
                        {stats?.totalSessions ? Math.round((stats.passedSessions / stats.totalSessions) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid Menu Portal */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider px-2 mb-3 text-left">Layanan SITA Wali</h3>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {/* Laporan */}
                  <button
                    onClick={() => setMainTab('laporan')}
                    className="flex flex-col items-center p-2 rounded-2xl hover:bg-emerald-50 transition-colors group cursor-pointer border-0 bg-transparent outline-none"
                  >
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-700 mt-2 leading-tight block">Rapor</span>
                  </button>

                  {/* Mushaf */}
                  <button
                    onClick={() => setMainTab('mushaf_tilawah')}
                    className="flex flex-col items-center p-2 rounded-2xl hover:bg-orange-50 transition-colors group cursor-pointer border-0 bg-transparent outline-none"
                  >
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-700 mt-2 leading-tight block">Mushaf</span>
                  </button>

                  {/* Sertifikat */}
                  <button
                    onClick={() => setMainTab('sertifikat')}
                    className="flex flex-col items-center p-2 rounded-2xl hover:bg-amber-50 transition-colors group cursor-pointer border-0 bg-transparent outline-none"
                  >
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-700 mt-2 leading-tight block">Sertifikat</span>
                  </button>

                  {/* Komunikasi */}
                  <button
                    onClick={() => setMainTab('komunikasi')}
                    className="flex flex-col items-center p-2 rounded-2xl hover:bg-indigo-50 transition-colors group cursor-pointer border-0 bg-transparent outline-none"
                  >
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-700 mt-2 leading-tight block">Chat</span>
                  </button>

                  {/* Murajaah Rumah */}
                  <button
                    onClick={() => setMainTab('home_murajaah')}
                    className="flex flex-col items-center p-2 rounded-2xl hover:bg-rose-50 transition-colors group cursor-pointer border-0 bg-transparent outline-none"
                  >
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Clock className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-700 mt-2 leading-tight block">Muraja'ah</span>
                  </button>
                </div>
              </div>


            </div>

            {/* Right Column: Karusel, Jadwal Sholat */}
            <div className="space-y-6">
              {/* Karusel Dokumentasi */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-3 text-left">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider px-2">Dokumentasi & Kegiatan SITA</h4>
                <SitaActivitiesSlider />
              </div>

              {/* Jadwal Sholat siluet masjid kecokelatan */}
              <div
                className="bg-[#8b5a2b]/95 border border-amber-800/10 rounded-3xl p-5 text-white relative overflow-hidden shadow-md select-none text-left"
                style={{
                  backgroundImage: 'linear-gradient(to bottom, rgba(139, 90, 43, 0.95), rgba(110, 68, 29, 0.98)), url("https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: '0 8px 30px rgba(139, 90, 43, 0.15)'
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(251,191,36,0.15),transparent_70%)] pointer-events-none"></div>
                <div className="relative flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                  <div>
                    <h3 className="font-extrabold text-sm tracking-tight text-amber-100">Jadwal Sholat Hari Ini</h3>
                    <p className="text-[9px] text-amber-200/70 font-semibold mt-0.5">Bogor, West Java • 27 Mei 2026</p>
                  </div>
                  <span className="text-[10px] bg-white/10 border border-white/10 py-1 px-2.5 rounded-full font-bold uppercase tracking-wider">Fardhu</span>
                </div>
                <div className="grid grid-cols-5 gap-2 relative z-10">
                  {[
                    { name: 'Subuh', time: '04:36' },
                    { name: 'Dzuhur', time: '11:52' },
                    { name: 'Ashar', time: '15:15' },
                    { name: 'Maghrib', time: '17:46' },
                    { name: 'Isya', time: '19:00' }
                  ].map((p) => (
                    <div key={p.name} className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-xl py-2 px-1 text-center backdrop-blur-xs">
                      <span className="text-[8px] font-black uppercase text-amber-200 tracking-wider leading-none">{p.name}</span>
                      <span className="text-xs font-extrabold text-white mt-1.5 leading-none">{p.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {mainTab === 'laporan' && (
        <main className="w-full px-4 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {selectedChildId === null ? (
            <div className="lg:col-span-3 text-center p-16 text-gray-400 font-medium">
              Tidak ada anak terdaftar di bawah akun wali ini.
            </div>
          ) : (
            <>
              {/* Left Column: Stats & Log */}
              <div className="lg:col-span-1 space-y-6">
                {selectedChild?.level && (
                  <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-3xl p-6 text-white shadow-lg shadow-emerald-100/50 relative overflow-hidden">

                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Level Info */}
                      <div className="space-y-4 flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner shrink-0">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest truncate">Level Target Hafalan</p>
                            <h4 className="text-base font-black tracking-tight leading-tight mt-0.5 truncate">{selectedChild.level.name}</h4>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20">
                          <div className="min-w-0">
                            <p className="text-[9px] text-emerald-250 font-bold uppercase tracking-wider">Cakupan</p>
                            <p className="text-[11px] font-extrabold mt-0.5 truncate" title={`${selectedChild.level.juzCount} Juz (${selectedChild.level.juzList.split(',').map((j: string) => `Juz ${j}`).join(', ')})`}>
                              {selectedChild.level.juzCount} Juz ({selectedChild.level.juzList.split(',').map((j: string) => `Juz ${j}`).join(', ')})
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] text-emerald-250 font-bold uppercase tracking-wider">Target Waktu</p>
                            <p className="text-[11px] font-extrabold mt-0.5">{selectedChild.level.targetDays} Hari</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Premium Glowing Radial Progress Bar */}
                      <div className="flex flex-col items-center justify-center shrink-0 w-28 h-28 relative">
                        <svg className="w-24 h-24 transform -rotate-90">
                          {/* Background Circle */}
                          <circle
                            cx="48"
                            cy="48"
                            r="36"
                            className="text-white/10"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                          />
                          {/* Glowing Progress Circle */}
                          <circle
                            cx="48"
                            cy="48"
                            r="36"
                            className="text-emerald-100 transition-all duration-1000 ease-out"
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 36}
                            strokeDashoffset={2 * Math.PI * 36 - (levelProgressPct / 100) * (2 * Math.PI * 36)}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            style={{ filter: 'drop-shadow(0px 0px 4px rgba(255,255,255,0.4))' }}
                          />
                        </svg>
                        {/* Text Inside Circle */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-lg font-black text-white tracking-tight leading-none">{levelProgressPct}%</span>
                          <span className="text-[8px] font-bold text-emerald-100 uppercase tracking-widest mt-0.5">Selesai</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                      <Flame className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Streak</p>
                      <p className="text-2xl font-extrabold text-gray-800">{stats?.currentStreak || 0} Hari</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Sesi</p>
                      <p className="text-2xl font-extrabold text-gray-800">{stats?.totalSessions || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Pass Rate Card */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-extrabold text-gray-800 mb-4">Tingkat Kelulusan {selectedChild?.name}</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 font-semibold">Lulus</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {stats?.totalSessions ? Math.round((stats.passedSessions / stats.totalSessions) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-emerald-500 h-3 rounded-full transition-all"
                      style={{ width: `${stats?.totalSessions ? (stats.passedSessions / stats.totalSessions) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 font-semibold mt-3">
                    {stats?.passedSessions || 0} dari {stats?.totalSessions || 0} sesi dinyatakan LULUS.
                  </p>
                </div>

                {/* Session Log (Mutaba'ah) */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-extrabold text-gray-800 text-sm md:text-base">Mutaba'ah Hafalan</h3>
                    <div className="bg-gray-100 p-1 rounded-xl flex border border-gray-200/50">
                      <button
                        type="button"
                        onClick={() => setHistoryTab('setoran')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          historyTab === 'setoran' ? "bg-white text-emerald-800 shadow-sm" : "text-gray-500 hover:text-gray-850"
                        )}
                      >
                        Setoran
                      </button>
                      <button
                        type="button"
                        onClick={() => setHistoryTab('murajaah')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          historyTab === 'murajaah' ? "bg-white text-emerald-800 shadow-sm" : "text-gray-500 hover:text-gray-850"
                        )}
                      >
                        Muraja'ah
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-150 max-h-[450px] overflow-y-auto p-4 space-y-6 scrollbar-thin">
                    {(() => {
                      const filtered = historyTab === 'setoran'
                        ? sessions.filter(s => s.sessionType === 'setoran_baru')
                        : sessions.filter(s => s.sessionType === 'murajaah' || s.sessionType?.startsWith('tasmi_') || s.sessionType === 'tasmi');
                      
                      if (filtered.length === 0) {
                        return <div className="py-8 text-center text-gray-400 text-sm font-medium">Belum ada data Mutaba'ah {historyTab === 'setoran' ? 'Setoran Baru' : "Muraja'ah"} anak.</div>;
                      }

                      // Group by Juz
                      const juzGroups: Record<number, any[]> = {};
                      filtered.forEach((s) => {
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

                        // Calculate unique page completion percentage for Ziyadah/Setoran
                        const passedSessionsInJuz = sessions.filter(
                          s => getJuzForSession(s) === juz && s.status === 'lulus' && s.sessionType === 'setoran_baru'
                        );
                        const uniquePages = new Set<number>();
                        passedSessionsInJuz.forEach(s => {
                          getPagesFromSession(s).forEach(p => uniquePages.add(p));
                        });
                        const completionPct = Math.min(100, Math.round((uniquePages.size / totalPagesInJuz) * 100));

                        // Calculate average score in this Juz
                        const allSessionsThisJuz = sessions.filter(s => getJuzForSession(s) === juz);
                        const averageScore = allSessionsThisJuz.length > 0
                          ? (allSessionsThisJuz.reduce((sum, s) => sum + s.scoreFinal, 0) / allSessionsThisJuz.length).toFixed(1)
                          : '-';

                        const juzLabel = JUZ_LABELS[juz] ? `Juz ${juz} — ${JUZ_LABELS[juz]}` : `Juz ${juz}`;

                        return (
                          <div key={juz} className="space-y-2 border border-slate-100 rounded-2xl p-3 bg-slate-50/50">
                            {/* Juz Separtor Header */}
                            <div className="flex flex-col space-y-1.5 pb-2.5 border-b border-gray-200/60">
                              <div className="flex justify-between items-center">
                                <h4 className="font-extrabold text-xs md:text-sm text-slate-800 tracking-tight">{juzLabel}</h4>
                                <div className="flex items-center space-x-2">
                                  <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full">
                                    Rata²: {averageScore}
                                  </span>
                                  {historyTab === 'setoran' && (
                                    <span className="text-[9px] font-black uppercase bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full">
                                      Tuntas: {completionPct}%
                                    </span>
                                  )}
                                </div>
                              </div>
                              {historyTab === 'setoran' && (
                                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${completionPct}%` }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Sessions inside Juz */}
                            <div className="divide-y divide-gray-100/60 space-y-1">
                              {sessionsInJuz.map((log) => (
                                <div
                                  key={log.id}
                                  onClick={() => setSelectedLog(log)}
                                  className="pt-2 pb-1.5 hover:bg-gray-100/50 cursor-pointer flex items-center justify-between transition-colors rounded-xl px-2"
                                >
                                  <div>
                                    <p className="font-bold text-gray-800 text-xs">
                                      {log.pageNumber ? `Halaman ${log.pageNumber}` : (log.startPage ? `Halaman ${log.startPage}–${log.endPage}` : `Surah ${log.surahId}`)}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                      {log.sessionType === 'setoran_baru' ? 'Setoran Baru' : (log.sessionType === 'murajaah' ? 'Muraja\'ah' : 'Tasmi\'')} • {new Date(log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="text-right">
                                      <span className="text-xs font-black text-gray-800">{log.scoreFinal}</span>
                                      <div
                                        className={cn(
                                          'text-[8px] font-black px-1.5 py-0.5 rounded-full mt-0.5 uppercase tracking-wider',
                                          log.status === 'lulus' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                        )}
                                      >
                                        {log.status}
                                      </div>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* Right Column: Main Dashboard Content (Takes 2 columns out of 3 on Desktop/Tablet) */}
              <div className="lg:col-span-2 space-y-8">

                {/* Badges & Rekomendasi Section (Moved to be clearly visible) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Rekomendasi Murajaah Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col text-left">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-800 text-sm md:text-base">Rekomendasi Murajaah Rumah</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Halaman Terlemah {selectedChild?.name}</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    {spacedRepetitionPages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                        <span className="text-3xl mb-2">⭐</span>
                        <p className="text-sm font-bold text-emerald-800">Maa Syaa Allah!</p>
                        <p className="text-xs text-emerald-600/80 font-medium max-w-[200px] mt-1">Hafalan {selectedChild?.name} saat ini sangat mutqin. Teruskan Ziyadah!</p>
                      </div>
                    ) : (
                      spacedRepetitionPages.slice(0, 3).map((item) => (
                        <div key={item.pageNumber} className="p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-100 flex items-center justify-between transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center shadow-xs">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Hal</span>
                              <span className="text-sm font-black text-slate-700 -mt-1">{item.pageNumber}</span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">Skor Kerawanan: {item.weight}</p>
                              <div className="flex items-center space-x-2 mt-0.5 text-[9px] font-bold text-slate-400">
                                <span className="text-red-500">Jali: {item.jaliCount}</span>
                                <span>•</span>
                                <span className="text-orange-500">Tark: {item.tarkCount}</span>
                                <span>•</span>
                                <span className="text-amber-500">Khafi: {item.khafiCount}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setHeatmapMode('page');
                              setSelectedPage(item.pageNumber);
                              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                            }}
                            className="py-1 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Lihat Peta
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Badge Gallery Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col text-left">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-800 text-sm md:text-base">Badge Apresiasi</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Apresiasi & Motivasi Anak</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 flex-1">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className={cn(
                          "relative overflow-hidden p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between group",
                          badge.unlocked
                            ? "bg-gradient-to-br from-white to-slate-50/50 border-slate-150 shadow-sm hover:shadow-md hover:scale-[1.02]"
                            : "bg-gray-50/40 border-gray-100 opacity-60"
                        )}
                      >
                        {badge.unlocked && (
                          <div className={cn("absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br opacity-5 rounded-full blur-xl group-hover:scale-150 transition-transform", badge.color)} />
                        )}
                        <div className="flex items-start justify-between">
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-inner",
                            badge.unlocked ? `bg-gradient-to-br ${badge.color} text-white` : "bg-gray-200 text-gray-400"
                          )}>
                            {badge.icon}
                          </div>
                          {badge.unlocked && badge.value && (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">
                              {badge.value}
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          <h4 className={cn("text-xs font-black", badge.unlocked ? "text-gray-800" : "text-gray-500")}>
                            {badge.name}
                          </h4>
                          <p className="text-[9px] text-gray-400 font-semibold mt-0.5 leading-tight">
                            {badge.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Heatmap & Kolom Kesalahan */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Peta Kesalahan */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-4 mb-5 gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-800">Peta Kesalahan {selectedChild?.name}</h2>
                    <p className="text-xs text-gray-400 font-medium">Analisis frekuensi kata yang sering keliru pada hafalan anak Anda.</p>
                  </div>
                  <div className="flex items-center space-x-2 flex-wrap gap-2">
                    <div className="bg-gray-100 p-1 rounded-xl flex border border-gray-200/50">
                      <button
                        type="button"
                        onClick={() => setHeatmapMode('surah')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          heatmapMode === 'surah' ? "bg-white text-emerald-800 shadow-sm" : "text-gray-500 hover:text-gray-850"
                        )}
                      >
                        Surah
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeatmapMode('page')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          heatmapMode === 'page' ? "bg-white text-emerald-800 shadow-sm" : "text-gray-500 hover:text-gray-850"
                        )}
                      >
                        Halaman
                      </button>
                    </div>
                    {heatmapMode === 'surah' ? (
                      <select
                        value={selectedSurah}
                        onChange={(e) => setSelectedSurah(e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="" disabled hidden>Pilih Surah...</option>
                        {surahs.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.id}. {s.nameEn}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={selectedPage}
                        onChange={(e) => setSelectedPage(parseInt(e.target.value))}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        {Array.from({ length: 604 }, (_, i) => i + 1).map((p) => {
                          const mappings = QURAN_PAGE_MAPPINGS[p] || [];
                          const surahLabels = mappings.map(m => {
                            const s = surahs.find(su => su.id === m.surahId);
                            return s ? s.nameEn : `Surah ${m.surahId}`;
                          });
                          const uniqueLabels = Array.from(new Set(surahLabels)).join(', ');
                          return (
                            <option key={p} value={p}>
                              Hal {p} ({uniqueLabels || '—'})
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-500 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="uppercase text-[10px] tracking-wider text-gray-400">Intensitas Salah:</span>
                  {[['0x','bg-white border border-gray-200'],['1–2x','bg-yellow-100 border-yellow-200'],['3–5x','bg-orange-100 border-orange-200'],['6–10x','bg-red-100 border-red-200'],['>10x','bg-red-500 border-red-700']].map(([label, cls]) => (
                    <div key={label} className="flex items-center space-x-1.5">
                      <span className={`w-3 h-3 rounded-sm border ${cls}`} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                <div className="h-9 mb-2">
                  {hoveredWord ? (
                    <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-100 text-emerald-950 px-3 py-1.5 rounded-xl w-fit text-xs">
                      <span className="font-bold quran-text text-base">"{hoveredWord.text}"</span>
                      <span>• Salah: <strong className="text-red-600">{hoveredWord.count}x</strong></span>
                      <span className="text-emerald-700">(Jali: {hoveredWord.jali}, Khafi: {hoveredWord.khafi}, Tark: {hoveredWord.tark})</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic text-xs">Arahkan kursor ke kata Al-Qur'an untuk melihat detail kesalahan bacaan anak.</span>
                  )}
                </div>

                {!selectedSurah && heatmapMode === 'surah' ? (
                  <div className="bg-white rounded-[24px] border border-gray-150 shadow-xs p-16 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                      <BookOpen className="w-8 h-8 opacity-50" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Pilih Surah untuk Dianalisis</h3>
                    <p className="text-gray-500 text-sm max-w-sm">
                      Silakan pilih surah dari dropdown di atas untuk melihat detail mushaf dan peta intensitas kesalahan hafalan anak Anda.
                    </p>
                  </div>
                ) : quranData ? (
                  <div className="relative bg-[#fbf9f4] rounded-[24px] shadow-lg border-2 border-emerald-800/80 p-6 md:p-8 overflow-y-auto max-h-[400px] transition-all">
                    <div
                      className="relative text-justify quran-text drop-shadow-sm leading-loose"
                      style={{ fontSize: '24px', lineHeight: 2.6 }}
                      dir="rtl"
                    >
                      {(() => {
                        return quranData.ayahs.map((ayah: any) => {
                          const currentSurahId = ayah.surahId || quranData.surah_id || selectedSurah;
                          const currentSurahObj = surahs.find(s => s.id === currentSurahId);
                          const surahNameAr = currentSurahObj?.nameAr || 'سورة';
                          const surahNameEn = currentSurahObj?.nameEn || '';

                          const isFirstAyah = ayah.ayah_id === 1;
                          const isSurah1 = currentSurahId === 1;
                          const isSurah9 = currentSurahId === 9;

                          const hasBismillahPrefix = isFirstAyah && !isSurah1 && !isSurah9 && ayah.words && ayah.words.length >= 4 &&
                            (ayah.words[0].text.includes("بِسْمِ") || ayah.words[0].text.includes("biasa") || ayah.words[0].text.includes("بسم"));

                          if (isSurah1 && isFirstAyah) {
                            return (
                              <React.Fragment key={ayah.id}>
                                <div className="w-full text-center my-4 select-none block" dir="ltr">
                                  <div className="inline-block w-full max-w-sm bg-gradient-to-r from-emerald-800/10 via-emerald-850/5 to-emerald-800/10 border-y border-emerald-800/20 py-2 px-4 rounded-md">
                                    <h3 className="font-serif font-black text-emerald-950 text-lg quran-text">
                                      {surahNameAr}
                                    </h3>
                                    <p className="text-[9px] uppercase font-extrabold tracking-widest text-emerald-800 mt-0.5">
                                      Surah {surahNameEn}
                                    </p>
                                  </div>
                                </div>

                                <div className="w-full text-center my-4 block font-serif font-semibold text-emerald-950/95 leading-normal select-none" dir="rtl">
                                  {ayah.words.map((word: any) => {
                                    const ws = getWordStats(currentSurahId, ayah.ayah_id, word.id);
                                    return (
                                      <React.Fragment key={word.id}>
                                        <span
                                          onMouseEnter={() => ws && setHoveredWord({ text: word.text, count: ws.count, jali: ws.jaliCount, khafi: ws.khafiCount, tark: ws.tarkCount })}
                                          onMouseLeave={() => setHoveredWord(null)}
                                          className={cn('px-1 py-0.5 rounded transition-all duration-150 select-none cursor-help', ws ? getHeatmapColor(ws.count) : '')}
                                        >
                                          {word.text}
                                        </span>
                                        {" "}
                                      </React.Fragment>
                                    );
                                  })}
                                  <span className="inline-flex items-center justify-center mx-2 text-emerald-600 font-sans text-lg opacity-85 select-none">
                                    ۝<span className="absolute text-[9px] font-bold pt-1">{ayah.ayah_id}</span>
                                  </span>
                                </div>
                              </React.Fragment>
                            );
                          }

                          const renderedWords = hasBismillahPrefix ? ayah.words.slice(4) : (ayah.words || []);

                          return (
                            <React.Fragment key={ayah.id}>
                              {isFirstAyah && (
                                <div className="w-full text-center my-4 select-none block" dir="ltr">
                                  <div className="inline-block w-full max-w-sm bg-gradient-to-r from-emerald-800/10 via-emerald-850/5 to-emerald-800/10 border-y border-emerald-800/20 py-2 px-4 rounded-md">
                                    <h3 className="font-serif font-black text-emerald-950 text-lg quran-text">
                                      {surahNameAr}
                                    </h3>
                                    <p className="text-[9px] uppercase font-extrabold tracking-widest text-emerald-800 mt-0.5">
                                      Surah {surahNameEn}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {hasBismillahPrefix && (
                                <div className="w-full text-center my-4 block font-serif font-semibold text-emerald-950/95 leading-normal select-none" dir="rtl">
                                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                                </div>
                              )}

                              {renderedWords.map((word: any) => {
                                const ws = getWordStats(currentSurahId, ayah.ayah_id, word.id);
                                return (
                                  <React.Fragment key={word.id}>
                                    <span
                                      onMouseEnter={() => ws && setHoveredWord({ text: word.text, count: ws.count, jali: ws.jaliCount, khafi: ws.khafiCount, tark: ws.tarkCount })}
                                      onMouseLeave={() => setHoveredWord(null)}
                                      className={cn('px-1 py-0.5 rounded transition-all duration-150 select-none cursor-help', ws ? getHeatmapColor(ws.count) : '')}
                                    >
                                      {word.text}
                                    </span>
                                    {" "}
                                  </React.Fragment>
                                );
                              })}

                              <span className="inline-flex items-center justify-center mx-2 text-emerald-600 font-sans text-lg opacity-85 select-none">
                                ۝<span className="absolute text-[9px] font-bold pt-1">{ayah.ayah_id}</span>
                              </span>
                              {" "}
                            </React.Fragment>
                          );
                        });
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="p-16 text-center text-gray-400 text-sm">Memuat teks Al-Qur'an...</div>
                )}

                {selectedLog && (
                  <div className="mt-5 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-1">Catatan Ustadz (Sesi Terpilih)</h4>
                    <p className="text-emerald-950 text-sm leading-relaxed font-medium">{selectedLog.notesUstadz || 'Tidak ada catatan khusus dari ustadz.'}</p>
                  </div>
                )}

                {/* Removed Badges and Rekomendasi (Moved to top) */}
              </div>

              {/* Kolom Kesalahan */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
                  <div className="flex items-center space-x-3 mb-5 border-b border-gray-50 pb-4">
                    <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-800 text-sm md:text-base">Kolom Kesalahan</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Titik Rawan Hafalan</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[500px]">
                    {heatmap.filter(h => heatmapMode === 'surah' ? (selectedSurah ? h.surahId === selectedSurah : true) : true).length === 0 ? (
                      <div className="py-12 text-center">
                        <span className="text-4xl mb-3 block opacity-30">✨</span>
                        <p className="text-sm font-bold text-gray-500">Belum ada catatan kesalahan di area ini.</p>
                      </div>
                    ) : (
                      heatmap
                        .filter(h => heatmapMode === 'surah' ? (selectedSurah ? h.surahId === selectedSurah : true) : true)
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 15) // Tampilkan top 15 kesalahan
                        .map((err, idx) => (
                          <div key={idx} className="flex flex-col border border-gray-100 p-3 rounded-2xl text-xs bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                            <div className="flex items-center justify-between w-full mb-1">
                              <div className="flex items-center space-x-2">
                                <span className={cn(
                                  'px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white',
                                  err.jaliCount > 0 ? 'bg-red-500' : (err.khafiCount > 0 ? 'bg-orange-500' : 'bg-gray-500')
                                )}>
                                  {err.count}x Salah
                                </span>
                              </div>
                              <div className="text-right" dir="rtl">
                                <span className="quran-text text-base font-bold text-emerald-900">Ayat {err.ayahId}</span>
                              </div>
                            </div>
                            <div className="text-[10px] text-gray-500 font-semibold mt-1">
                              Surah {surahs.find(s => s.id === err.surahId)?.nameEn || err.surahId}
                            </div>
                            <div className="mt-2 text-[10px] font-bold text-gray-400 flex space-x-2">
                              {err.jaliCount > 0 && <span className="text-red-500">Jali: {err.jaliCount}</span>}
                              {err.khafiCount > 0 && <span className="text-orange-500">Khafi: {err.khafiCount}</span>}
                              {err.tarkCount > 0 && <span className="text-gray-500">Tark: {err.tarkCount}</span>}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
              </div>

              {/* Laporan Mutabaah Murajaah Rumah */}
              <div className="col-span-1 lg:col-span-3 mt-6">
                <MutabaahMurojaahReport />
              </div>
            </>
          )}
        </main>
      )}

      {mainTab === 'komunikasi' && (
        <main className="w-full px-4 md:px-8 mt-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col" style={{ height: '70vh' }}>
            <div className="p-4 border-b border-gray-100 bg-emerald-50/30 rounded-t-3xl">
              <h2 className="text-lg font-black text-emerald-950 flex items-center gap-2">
                Buku Penghubung {selectedChild?.name}
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-1">Berkomunikasi langsung dengan Musyrif Halaqah</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm font-bold text-gray-400">
                  Belum ada pesan. Mulai percakapan dengan ustadz sekarang.
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
                          {isMe ? "Anda" : (msg.sender?.name || 'Ustadz')} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100 rounded-b-3xl">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Tulis pesan untuk ustadz..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </main>
      )}

      {/* Session Replay Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest bg-emerald-100 text-emerald-800 uppercase mb-1.5">
                  REPLAY SESI SETORAN ANAK
                </span>
                <h3 className="text-lg font-black text-gray-900">
                  {selectedChild?.name || 'Detail Sesi'}
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
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-all cursor-pointer"
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
                    <button onClick={() => setSelectedReplayError(null)} className="text-[10px] text-red-500 hover:text-red-700 font-bold px-2.5 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-all cursor-pointer">Tutup Replika</button>
                  </div>
                  {logQuran ? (
                    <div className="relative bg-[#fbf9f4] rounded-2xl shadow-md border-2 border-emerald-800/80 p-6 max-h-[400px] overflow-y-auto">
                      <div
                        className="relative text-justify quran-text drop-shadow-sm leading-loose"
                        style={{ fontSize: '24px', lineHeight: 2.6 }}
                        dir="rtl"
                      >
                        {logQuran.ayahs.filter((ayah: any) => Number(ayah.ayah_id) === Number(selectedReplayError.ayahId) && Number(ayah.surahId || logQuran.surah_id) === Number(selectedReplayError.surahId)).map((ayah: any) => {
                          const isFirstAyahOfSurah = ayah.ayah_id === 1;
                          const isSurah1 = ayah.surahId === 1;
                          const isSurah9 = ayah.surahId === 9;

                          const hasBismillahPrefix = isFirstAyahOfSurah && !isSurah1 && !isSurah9 && ayah.words && ayah.words.length >= 4 &&
                            (ayah.words[0].text.includes("بِسْمِ") || ayah.words[0].text.includes("biasa") || ayah.words[0].text.includes("بسم"));

                          if (isSurah1 && isFirstAyahOfSurah) {
                            return (
                              <React.Fragment key={ayah.id}>
                                <div className="w-full text-center my-4 select-none block" dir="ltr">
                                  <div className="inline-block w-full max-w-sm bg-gradient-to-r from-emerald-800/10 via-emerald-850/5 to-emerald-800/10 border-y border-emerald-800/20 py-2 px-4 rounded-md">
                                    <h3 className="font-serif font-black text-emerald-950 text-lg quran-text">
                                      {surahs.find(s => Number(s.id) === Number(ayah.surahId))?.nameAr || 'سورة الفاتحة'}
                                    </h3>
                                    <p className="text-[9px] uppercase font-extrabold tracking-widest text-emerald-800 mt-0.5">
                                      Surah {surahs.find(s => Number(s.id) === Number(ayah.surahId))?.nameEn || 'Al-Fatihah'}
                                    </p>
                                  </div>
                                </div>

                                <div className="w-full text-center my-4 block font-serif font-semibold text-emerald-950/95 leading-normal select-none" dir="rtl">
                                  {ayah.words.map((word: any) => {
                                    const bm = selectedLog.errors?.find((b: any) => Number(b.surahId) === Number(ayah.surahId) && Number(b.ayahId) === Number(ayah.ayah_id) && Number(b.wordIndex) === Number(word.id));
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
                              {isFirstAyahOfSurah && (
                                <div className="w-full text-center my-4 select-none block" dir="ltr">
                                  <div className="inline-block w-full max-w-sm bg-gradient-to-r from-emerald-800/10 via-emerald-850/5 to-emerald-800/10 border-y border-emerald-800/20 py-2 px-4 rounded-md">
                                    <h3 className="font-serif font-black text-emerald-950 text-lg quran-text">
                                      {surahs.find(s => Number(s.id) === Number(ayah.surahId))?.nameAr || 'سورة'}
                                    </h3>
                                    <p className="text-[9px] uppercase font-extrabold tracking-widest text-emerald-800 mt-0.5">
                                      Surah {surahs.find(s => Number(s.id) === Number(ayah.surahId))?.nameEn || ''}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {hasBismillahPrefix && (
                                <div className="w-full text-center my-4 block font-serif font-semibold text-emerald-950/95 leading-normal select-none" dir="rtl">
                                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                                </div>
                              )}

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
                  <h4 className="font-bold text-gray-800 text-sm">Daftar Rincian & Letak Kesalahan Kata:</h4>
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
                                {surahs.find(s => Number(s.id) === Number(err.surahId))?.nameEn || `Surah ${err.surahId}`} : Ayat {err.ayahId}
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

              {selectedLog.notesUstadz && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                  <h4 className="font-bold text-emerald-955 text-sm mb-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1.5" /> Catatan Ustadz:
                  </h4>
                  <p className="text-emerald-900 text-sm leading-relaxed">{selectedLog.notesUstadz}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Card Modal */}
      {showShareCard && selectedLog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative p-6">
            <div className="border-2 border-emerald-500/30 rounded-2xl p-6 relative">
              {/* Seal or Badge Icon */}
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20 mb-4 animate-bounce">
                👑
              </div>

              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1 text-center">
                KARTU PRESTASI TAHFIDZ
              </h3>
              <p className="text-[9px] text-gray-500 font-extrabold tracking-wider uppercase mb-5 text-center">
                {appName} DIGITAL APPRECIATION
              </p>

              {/* Decorative Ribbon */}
              <div className="text-center mb-6">
                <div className="bg-emerald-950/80 border border-emerald-500/20 text-emerald-300 font-black py-2 px-4 rounded-xl inline-block text-xs uppercase tracking-wider">
                  {selectedLog.setoranScope === 'tasmi_juz' ? "Tasmi' 1 Juz Penuh" : (selectedLog.setoranScope === 'three_quarter_juz' || selectedLog.setoranScope === 'tiga_perempat_juz' ? "Murajaah 3/4 Juz" : (selectedLog.setoranScope === 'half_juz' || selectedLog.setoranScope === 'setengah_juz' ? "Murajaah 1/2 Juz" : "Murajaah 1/4 Juz"))} LULUS
                </div>
              </div>

              {/* Message */}
              <div className="space-y-4 text-sm md:text-base leading-relaxed text-gray-100 font-medium font-serif text-center">
                <p>Alhamdulillah, dengan limpahan rahmat Allah SWT,</p>
                <p className="text-xl font-black tracking-tight text-white font-sans bg-emerald-500/10 py-2 px-4 rounded-xl border border-emerald-500/20 w-fit mx-auto">
                  {selectedChild?.name}
                </p>
                <p>
                  telah dinyatakan <span className="text-emerald-400 font-black">LULUS</span> pada ujian juz <span className="font-bold text-white">{selectedLog.juzId}</span> dengan nilai kelulusan yang luar biasa:
                </p>
                <p className="text-3xl font-black text-amber-400 font-sans">
                  {selectedLog.scoreFinal}
                </p>
                <p className="text-xs text-gray-400 italic font-sans mt-4">
                  "Semoga menjadi hafalan yang mutqin, kokoh, dan membawa mahkota kemuliaan bagi orang tua di akhirat kelak. Aamiin."
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  const scopeLabel = selectedLog.setoranScope === 'tasmi_juz' ? "Tasmi' 1 Juz Penuh" : (selectedLog.setoranScope === 'three_quarter_juz' || selectedLog.setoranScope === 'tiga_perempat_juz' ? "Murajaah 3/4 Juz" : (selectedLog.setoranScope === 'half_juz' || selectedLog.setoranScope === 'setengah_juz' ? "Murajaah 1/2 Juz" : "Murajaah 1/4 Juz"));
                  const text = `Alhamdulillah! Ananda *${selectedChild?.name}* telah dinyatakan *LULUS* pada ujian *${scopeLabel}* pada Juz *${selectedLog.juzId}* dengan nilai: *${selectedLog.scoreFinal}*.\n\nSemoga hafalan Ananda diberkahi Allah SWT, kokoh (mutqin), dan mendatangkan mahkota kemuliaan bagi orang tuanya di surga kelak. Aamiin. 🌸📖\n\n- Dikirim via Aplikasi *SiTa Tahfidz*`;
                  navigator.clipboard.writeText(text);
                  alert('Teks berhasil disalin! Siap dibagikan ke WhatsApp.');
                }}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-950 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Salin Teks WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => setShowShareCard(false)}
                className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-sm transition-all active:scale-95 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {mainTab === 'sertifikat' && (
        <main className="w-full px-4 md:px-8 mt-6 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-xl font-black text-emerald-950 flex items-center gap-2">
                <Award className="w-6 h-6 text-emerald-600" /> Sertifikat Emas Kelulusan {selectedChild?.name}
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Berikut adalah daftar sertifikat kelulusan ujian juziyah ananda yang telah diterbitkan secara resmi oleh Koordinator.
              </p>
            </div>

            {certificates.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" />
                <p className="text-sm font-bold">Belum ada sertifikat juziyah yang diterbitkan untuk ananda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                  <div key={cert.id} className="bg-gradient-to-tr from-slate-950 to-slate-900 border border-[#d4af37]/35 p-5 rounded-3xl flex flex-col justify-between gap-5 relative group overflow-hidden shadow-md">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#d4af37]/5 border-b border-l border-[#d4af37]/10 rounded-bl-3xl flex items-center justify-center">
                      <Award className="w-5 h-5 text-[#d4af37]/40" />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-[#d4af37] font-extrabold uppercase tracking-widest block">Sertifikat Kelulusan</span>
                        <h4 className="font-extrabold text-sm text-white mt-1">Juz {cert.exam.juzId}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">Nomor: {cert.certificateNo}</p>
                      </div>
                      <div className="h-[1px] bg-slate-800"></div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Nilai Ujian:</span>
                          <span className="font-extrabold text-slate-200">{cert.exam.score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tanggal Terbit:</span>
                          <span className="font-medium text-gray-300">
                            {new Date(cert.issuedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="w-full bg-[#d4af37]/10 hover:bg-[#d4af37] hover:text-slate-950 text-[#d4af37] font-bold py-2.5 rounded-xl text-xs transition-all border border-[#d4af37]/20 uppercase tracking-wider cursor-pointer"
                    >
                      Buka Sertifikat Emas
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      {mainTab === 'mushaf_tilawah' && (
        <main className="w-full px-0 mt-0 animate-fadeIn bg-[#fcf8f2]">
          <style>{`
            @keyframes slideInFromRight {
              from { transform: translateX(30px); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideInFromLeft {
              from { transform: translateX(-30px); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            .animate-slide-right {
              animation: slideInFromRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .animate-slide-left {
              animation: slideInFromLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            
            .quran-text-content {
              font-size: 25px !important;
              line-height: 2.6 !important;
            }
            @media (max-width: 640px) {
              .quran-text-content {
                font-size: 19px !important;
                line-height: 2.1 !important;
              }
            }
            @media (min-width: 641px) and (max-width: 1024px) {
              .quran-text-content {
                font-size: 22px !important;
                line-height: 2.3 !important;
              }
            }
            
            /* Custom responsive sizing to fit screen height on mobile/tablet/iPad without scrolling */
            .mushaf-paper {
              min-height: calc(100vh - 120px) !important;
              max-height: none !important;
              border: none !important;
              border-radius: 0px !important;
              box-shadow: inset 0px 0px 30px rgba(184, 154, 114, 0.2) !important;
            }
            @media (max-width: 640px) {
              .mushaf-paper {
                padding: 12px 16px !important;
              }
              .surah-banner {
                margin: 8px 0 !important;
                padding: 6px 10px !important;
              }
            }
            @media (min-width: 641px) and (max-width: 1024px) {
              .mushaf-paper {
                padding: 24px 32px !important;
              }
            }
          `}</style>
          <div className="flex flex-col w-full">
            <div className="flex items-center justify-center border-b border-emerald-800/10 bg-[#fdfbfa]/95 backdrop-blur-md py-3 px-4 shadow-xs select-none">
              {/* Navigation Controls */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                {/* Juz Selector */}
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider mb-1">Juz:</span>
                  <select
                    value={getJuzForPage(tilawahPage)}
                    onChange={(e) => {
                      const juz = Number(e.target.value);
                      const range = getJuzPageRange(juz);
                      setTilawahPage(range.start);
                    }}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                      <option key={j} value={j}>Juz {j}</option>
                    ))}
                  </select>
                </div>

                {/* Surah Selector */}
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider mb-1">Surah:</span>
                  <select
                    value={tilawahAyahs.length > 0 ? tilawahAyahs[0].surahId : 1}
                    onChange={(e) => {
                      const sId = Number(e.target.value);
                      const pages = getPagesForSurah(sId);
                      if (pages.length > 0) {
                        setTilawahPage(pages[0]);
                      }
                    }}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[150px]"
                  >
                    {surahs.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.id}. {s.nameEn}</option>
                    ))}
                  </select>
                </div>

                {/* Page Selector */}
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider mb-1">Halaman:</span>
                  <select
                    value={tilawahPage}
                    onChange={(e) => setTilawahPage(Number(e.target.value))}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {Array.from({ length: 604 }, (_, i) => i + 1).map((p) => (
                      <option key={p} value={p}>Hal. {p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Printed Mushaf Paper Container */}
            <div className="relative w-full max-w-full mx-auto select-none">
              {/* Previous Page Button (Left Side - Floating) */}
              <button
                type="button"
                disabled={tilawahPage <= 1}
                onClick={() => setTilawahPage(prev => Math.max(1, prev - 1))}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 disabled:opacity-30 disabled:hover:bg-emerald-50/95 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer z-20 border border-emerald-800/10"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>

              {/* Parchment Paper Page */}
              <div
                className="w-full bg-[#fcf8f2] border-0 rounded-none p-4 sm:p-6 md:p-8 flex flex-col justify-between relative mx-auto select-none mushaf-paper"
                style={{
                  backgroundImage: 'radial-gradient(circle, #fdfbfa 0%, #fbf5eb 100%)',
                  boxShadow: 'inset 0px 0px 30px rgba(184, 154, 114, 0.18)'
                }}
              >
                {/* Vintage Gilded Corner Accents */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-800/40 rounded-tl-md"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-800/40 rounded-tr-md"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-800/40 rounded-bl-md"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-800/40 rounded-br-md"></div>
 
                {/* Page Header (Surah and Juz) */}
                <div className="flex justify-between items-center border-b border-emerald-800/20 pb-2 text-[10px] font-black uppercase tracking-widest text-emerald-800/70 mb-3 md:mb-4 px-2 relative">
                  <span>Juz {getJuzForPage(tilawahPage)}</span>
                  {tilawahLoading && (
                    <span className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-emerald-850/10 text-emerald-800 px-2 py-0.5 rounded-full text-[8px] tracking-widest font-sans animate-pulse">
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping"></span>
                      MEMUAT...
                    </span>
                  )}
                  <span className="font-serif normal-case font-bold text-sm">
                    {tilawahAyahs.length > 0 && tilawahSurahNames[tilawahAyahs[0].surahId]
                      ? tilawahSurahNames[tilawahAyahs[0].surahId].nameAr
                      : 'Al-Qur\'an'}
                  </span>
                </div>
 
                {/* Arabic Text Content */}
                <div className="flex-1 flex flex-col justify-center">
                  {tilawahAyahs.length === 0 && tilawahLoading ? (
                    <div className="text-center py-16">
                      <span className="text-4xl animate-pulse block mb-4">📖</span>
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest animate-pulse font-sans">Memuat Kalamullah...</p>
                    </div>
                  ) : tilawahAyahs.length > 0 ? (
                    <div
                      key={tilawahPage}
                      className={cn(
                        "text-justify quran-text font-serif px-2 drop-shadow-sm select-none quran-text-content transition-all duration-300",
                        tilawahLoading ? "opacity-35 scale-[0.98] blur-[0.2px]" : "opacity-100 scale-100",
                        slideDir === 'next' ? 'animate-slide-right' : 'animate-slide-left'
                      )}
                      dir="rtl"
                    >
                      {tilawahAyahs.map((ayah: any) => {
                        const isFirstAyah = ayah.ayah_id === 1;
                        const isSurah1 = ayah.surahId === 1;
                        const isSurah9 = ayah.surahId === 9;

                        const hasBismillahPrefix = isFirstAyah && !isSurah1 && !isSurah9 && ayah.words && ayah.words.length >= 4 &&
                          (ayah.words[0].text.includes("بِسْمِ") || ayah.words[0].text.includes("بسم"));

                        if (isSurah1 && isFirstAyah) {
                          return (
                            <React.Fragment key={ayah.id}>
                              {/* Surah Start Banner */}
                              <div className="w-full text-center my-4 select-none block" dir="ltr">
                                <div className="inline-block w-full max-w-sm bg-gradient-to-r from-emerald-850/10 via-emerald-900/5 to-emerald-850/10 border-y border-emerald-800/20 py-2 px-4 rounded-md">
                                  <h3 className="font-serif font-black text-emerald-950 text-lg quran-text">
                                    {tilawahSurahNames[ayah.surahId]?.nameAr || 'سورة الفاتحة'}
                                  </h3>
                                  <p className="text-[9px] uppercase font-extrabold tracking-widest text-emerald-800 mt-0.5 font-sans">
                                    Surah {tilawahSurahNames[ayah.surahId]?.nameEn || 'Al-Fatihah'}
                                  </p>
                                </div>
                              </div>

                              {/* Centered Bismillah for Surah 1 Ayah 1 */}
                              <div className="w-full text-center my-4 block font-serif font-semibold text-emerald-950/95 leading-normal select-none" dir="rtl">
                                {ayah.words.map((word: any) => (
                                  <React.Fragment key={word.id}>
                                    <span className="select-none">{word.text}</span>
                                    {" "}
                                  </React.Fragment>
                                ))}
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
                            {/* Surah Start Banner for other Surahs */}
                            {isFirstAyah && (
                              <div className="w-full text-center my-4 select-none block" dir="ltr">
                                <div className="inline-block w-full max-w-sm bg-gradient-to-r from-emerald-850/10 via-emerald-900/5 to-emerald-850/10 border-y border-emerald-800/20 py-2 px-4 rounded-md">
                                  <h3 className="font-serif font-black text-emerald-950 text-lg quran-text">
                                    {tilawahSurahNames[ayah.surahId]?.nameAr || 'سورة'}
                                  </h3>
                                  <p className="text-[9px] uppercase font-extrabold tracking-widest text-emerald-800 mt-0.5 font-sans">
                                    Surah {tilawahSurahNames[ayah.surahId]?.nameEn || ''}
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
                            {renderedWords.map((word: any) => (
                              <React.Fragment key={word.id}>
                                <span className="select-none">{word.text}</span>
                                {" "}
                              </React.Fragment>
                            ))}

                            {/* Ayah Marker */}
                            <span className="inline-flex items-center justify-center mx-1 text-emerald-600 font-sans text-base opacity-80 select-none">
                              ۝<span className="absolute text-[9px] font-bold pt-1">{ayah.ayah_id}</span>
                            </span>
                            {" "}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-gray-400 italic font-sans">
                      Gagal memuat teks Al-Qur'an.
                    </div>
                  )}
                </div>

                {/* Page Footer (Page Number) */}
                <div className="border-t border-emerald-800/10 pt-3 mt-4 text-center">
                  <span className="bg-emerald-800/5 border border-emerald-850/10 text-emerald-800 font-bold text-xs px-4 py-1.5 rounded-full shadow-inner select-none font-sans">
                    {tilawahPage}
                  </span>
                </div>
              </div>

              {/* Next Page Button (Right Side - Floating) */}
              <button
                type="button"
                disabled={tilawahPage >= 604}
                onClick={() => setTilawahPage(prev => Math.min(604, prev + 1))}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 disabled:opacity-30 disabled:hover:bg-emerald-50/95 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer z-20 border border-emerald-800/10"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ══ MURAJAAH RUMAH TAB ══ */}
      {mainTab === 'home_murajaah' && (
        <main className="w-full px-4 md:px-8 mt-6 max-w-7xl mx-auto pb-24 animate-fadeIn">
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-emerald-600" />
                Penyimakan Muraja'ah Harian di Rumah
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Silakan simak hafalan ananda di rumah sesuai target penugasan harian dari Ustadz/Ustadzah.
              </p>
            </div>

            {/* List Tugas pending & history */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* KOLOM KIRI: Tugas Menunggu Penyimakan */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 w-fit uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                  Perlu Disimak ({parentAssignments.filter((a: any) => !a.feedbackAt).length})
                </h3>

                <div className="space-y-4">
                  {parentAssignments.filter((a: any) => !a.feedbackAt).length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-xs font-bold">
                      Tidak ada penugasan muraja'ah rumah yang perlu disimak saat ini.
                    </div>
                  ) : (
                    parentAssignments.filter((a: any) => !a.feedbackAt).map((a: any) => (
                      <div key={a.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 hover:border-emerald-200 transition-all space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={cn(
                              "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                              a.shift.toLowerCase() === 'subuh' ? "bg-sky-50 text-sky-700" : "bg-indigo-50 text-indigo-700"
                            )}>
                              {a.shift}
                            </span>
                            <h4 className="font-serif font-black text-slate-800 text-base mt-2">{a.targetName}</h4>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-xl">
                            {new Date(a.assignedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs border-t border-gray-50 pt-3">
                          <p className="text-gray-400 font-medium">
                            Ananda: <span className="font-extrabold text-slate-700">{a.student?.name}</span>
                          </p>
                          <p className="text-gray-400 font-medium">
                            Ustadz: <span className="font-extrabold text-slate-700">{a.ustadz?.name}</span>
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setActiveAssignmentForFeedback(a);
                            setFeedbackIsExecuted(true);
                            setFeedbackIsTargetMet(true);
                            setFeedbackIsFluent(true);
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-2xl text-xs transition-all shadow-md shadow-emerald-700/10 cursor-pointer"
                        >
                          Isi Penyimakan Rumah
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* KOLOM KANAN: Riwayat Penyimakan */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 w-fit uppercase tracking-wider flex items-center gap-1">
                  Sudah Disimak ({parentAssignments.filter((a: any) => a.feedbackAt).length})
                </h3>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  {parentAssignments.filter((a: any) => a.feedbackAt).length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-xs font-bold">
                      Belum ada riwayat penyimakan.
                    </div>
                  ) : (
                    parentAssignments.filter((a: any) => a.feedbackAt).map((a: any) => (
                      <div key={a.id} className="bg-slate-50/50 rounded-3xl border border-gray-100 p-5 space-y-4 text-xs font-semibold text-gray-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={cn(
                              "inline-flex items-center justify-center px-2 py-0.2 rounded text-[8px] font-black uppercase tracking-wider text-white",
                              a.isExecuted ? "bg-emerald-600" : "bg-rose-500"
                            )}>
                              {a.isExecuted ? 'Melaksanakan' : 'Tidak Melaksanakan'}
                            </span>
                            <h4 className="font-bold text-slate-800 text-sm mt-1">{a.targetName}</h4>
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {new Date(a.assignedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>

                        {a.isExecuted && (
                          <div className="flex gap-2">
                            <span className={cn(
                              "px-1.5 py-0.2 rounded text-[9px] font-extrabold",
                              a.isTargetMet ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                            )}>
                              {a.isTargetMet ? 'Sesuai Target' : 'Kurang Target'}
                            </span>
                            <span className={cn(
                              "px-1.5 py-0.2 rounded text-[9px] font-extrabold",
                              a.isFluent ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700"
                            )}>
                              {a.isFluent ? 'Lancar' : 'Kurang Lancar'}
                            </span>
                          </div>
                        )}

                        {a.parentNotes && (
                          <div className="bg-white border border-gray-100 rounded-xl p-2.5 text-gray-500 italic text-[11px]">
                            "{a.parentNotes}"
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-gray-100/60 pt-2 text-[10px] text-gray-400">
                          <p>TTD Ortu: <span className="font-extrabold text-gray-600">{a.parentSignature}</span></p>
                          <p>Disimak pada {new Date(a.feedbackAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </main>
      )}
      {mainTab === 'password' && (
        <main className="w-full px-4 md:px-8 mt-6 max-w-md mx-auto pb-24 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6 text-left">
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">Ubah Password Anda</h3>
              <p className="text-xs text-gray-400 mt-1">Ubah password login Anda saat ini secara mandiri.</p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const currentPw = (e.target as any).currentPassword.value;
                const newPw = (e.target as any).newPassword.value;
                const confirmPw = (e.target as any).confirmPassword.value;

                if (newPw !== confirmPw) {
                  alert('Konfirmasi password baru tidak sesuai!');
                  return;
                }
                if (newPw.length < 6) {
                  alert('Password baru minimal 6 karakter!');
                  return;
                }

                try {
                  await api.changePassword(currentPw, newPw);
                  alert('Password Anda berhasil diubah!');
                  (e.target as HTMLFormElement).reset();
                } catch (err: any) {
                  alert('Gagal mengubah password: ' + err.message);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Password Saat Ini</label>
                <input
                  type="password"
                  name="currentPassword"
                  required
                  className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all text-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Password Baru</label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all text-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all text-gray-800"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-sm"
              >
                Ubah Password
              </button>
            </form>
          </div>
        </main>
      )}

      {/* ══ MURAJAAH FEEDBACK FORM MODAL ══ */}
      {activeAssignmentForFeedback && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-gray-100 flex flex-col max-h-[90vh] overflow-y-auto animate-scaleUp text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">Penyimakan Muraja'ah Harian</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">FORM PENYIMAKAN ORANG TUA</p>
              </div>
              <button
                onClick={() => setActiveAssignmentForFeedback(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 p-1.5 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs font-semibold text-gray-700">
              {/* Ringkasan Tugas */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                <p className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Tugas dari Ustadz/Ustadzah</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-400">Hari / Tanggal</span>
                  <span className="font-extrabold text-slate-800">
                    {new Date(activeAssignmentForFeedback.assignedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-400">Waktu Muraja'ah</span>
                  <span className="font-extrabold text-slate-800">{activeAssignmentForFeedback.shift}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-400">Target Hafalan</span>
                  <span className="font-extrabold text-emerald-800 text-sm">{activeAssignmentForFeedback.targetName}</span>
                </div>
              </div>

              {/* Melaksanakan / Tidak */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-2">Pelaksanaan Muraja'ah</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setFeedbackIsExecuted(true)}
                    className={cn(
                      "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                      feedbackIsExecuted ? "bg-white text-emerald-950 shadow-sm border border-emerald-50" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    Melaksanakan
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackIsExecuted(false)}
                    className={cn(
                      "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                      !feedbackIsExecuted ? "bg-white text-rose-950 shadow-sm border border-rose-50" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    Tidak Melaksanakan
                  </button>
                </div>
              </div>

              {/* Detail parameters - only if executed */}
              {feedbackIsExecuted && (
                <div className="space-y-4 border-l-2 border-emerald-100 pl-4 py-1 animate-fadeIn">
                  {/* Sesuai Target */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-2">Kesesuaian Target Hafalan</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                      <button
                        type="button"
                        onClick={() => setFeedbackIsTargetMet(true)}
                        className={cn(
                          "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                          feedbackIsTargetMet ? "bg-white text-emerald-950 shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        Sesuai Target
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackIsTargetMet(false)}
                        className={cn(
                          "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                          !feedbackIsTargetMet ? "bg-white text-orange-950 shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        Belum Sesuai
                      </button>
                    </div>
                  </div>

                  {/* Kelancaran */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-2">Tingkat Kelancaran Ananda</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                      <button
                        type="button"
                        onClick={() => setFeedbackIsFluent(true)}
                        className={cn(
                          "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                          feedbackIsFluent ? "bg-white text-emerald-950 shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        Lancar & Fasih
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackIsFluent(false)}
                        className={cn(
                          "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                          !feedbackIsFluent ? "bg-white text-amber-950 shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        Kurang Lancar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tanda Tangan */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1.5">Tanda Tangan Orangtua (Tulis Nama)</label>
                <input
                  type="text"
                  value={feedbackSignature}
                  onChange={(e) => setFeedbackSignature(e.target.value)}
                  placeholder="Misal: Bapak Ahmad"
                  className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 font-extrabold"
                  required
                />
              </div>

              {/* Keterangan / Notes */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1.5">Catatan Tambahan / Keterangan</label>
                <textarea
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Ketik catatan di sini (opsional)..."
                  rows={2}
                  className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 font-semibold"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitHomeFeedbackMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-2xl text-xs transition-all duration-150 flex items-center justify-center gap-2 shadow-md shadow-emerald-700/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitHomeFeedbackMutation.isPending ? 'Menyimpan...' : 'Simpan & Kirim Penyimakan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══ SELECTED CERTIFICATE MODAL FOR VISUAL PREVIEW & PRINT ══ */}
      {selectedCert && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-50">Sertifikat Kelulusan Juziyah Ananda</h3>
                <p className="text-xs text-slate-400 mt-0.5">Tekan Cetak Sertifikat untuk mencetak atau menyimpan dalam format PDF.</p>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="flex justify-center overflow-x-auto py-4">
              <div
                id="print-area"
                className="w-[297mm] h-[210mm] bg-[#fffdf6] border-[12px] border-double border-[#d4af37] rounded-3xl p-12 text-[#1e293b] flex flex-col justify-between relative shadow-lg tracking-wide select-none shrink-0"
                style={{
                  fontFamily: '"Georgia", serif',
                  backgroundImage: 'radial-gradient(circle, #fffef9 0%, #fffcf2 100%)'
                }}
              >
                {/* Corners */}
                <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-[#d4af37] rounded-tl-xl"></div>
                <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-[#d4af37] rounded-tr-xl"></div>
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-[#d4af37] rounded-bl-xl"></div>
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-[#d4af37] rounded-br-xl"></div>

                {/* Top Section */}
                <div className="text-center space-y-3 mt-4">
                  {appLogo ? (
                    <img src={appLogo} alt={appName} className="w-16 h-16 object-contain rounded-md mx-auto" />
                  ) : (
                    <div className="w-16 h-16 bg-[#d4af37]/10 border-2 border-[#d4af37]/60 rounded-full flex items-center justify-center font-serif text-[#d4af37] font-bold text-2xl mx-auto shadow-sm">
                      S
                    </div>
                  )}
                  <h2 className="text-2xl font-bold tracking-widest text-[#8a6b18] uppercase" style={{ fontFamily: 'Cinzel, Georgia, serif' }}>
                    {appName}
                  </h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">Lembaga Sertifikasi Tahfidzul Qur'an Digital</p>
                  <div className="h-[2px] w-24 bg-[#d4af37] mx-auto mt-2.5"></div>
                </div>

                {/* Decree */}
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                  <h1 className="text-3xl font-extrabold text-[#7c631a] tracking-wider my-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    SERTIFIKAT KELULUSAN
                  </h1>
                  <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">Diberikan secara istimewa kepada:</p>
                  
                  <div className="py-2">
                    <h2 className="text-3xl font-black tracking-wide text-slate-900 border-b-2 border-slate-300 pb-2 inline-block px-10">
                      {selectedChild?.name}
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase mt-2 tracking-wide">Nomor Induk Santri (NIS): {selectedChild?.nis || '-'}</p>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed max-w-xl mx-auto mt-3">
                    Atas tuntasnya kelayakan ujian hafalan juziyah yang diuji secara langsung dan menyeluruh
                    pada kategori <span className="font-bold text-[#8a6b18]">Juz {selectedCert.exam.juzId}</span> dengan predikat tingkat kelulusan <span className="font-extrabold text-[#8a6b18] uppercase tracking-wider">Sangat Baik (Skor: {selectedCert.exam.score})</span>.
                  </p>
                </div>

                {/* Signatures */}
                <div className="flex justify-between items-end border-t border-slate-200/80 pt-6 mt-4">
                  <div className="text-left space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">No. Sertifikat:</p>
                    <p className="font-mono text-xs font-bold text-slate-700 tracking-wider bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
                      {selectedCert.certificateNo}
                    </p>
                  </div>

                  <div className="text-center space-y-1.5 shrink-0 pr-8">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Diterbitkan Pada:</p>
                    <p className="text-xs font-bold text-slate-800">
                      {new Date(selectedCert.issuedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="h-10"></div>
                    <div className="w-48 h-[1px] bg-slate-400 mx-auto"></div>
                    <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mt-1">Ustadzah Sarah (Koordinator)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-2xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/10 uppercase tracking-wide cursor-pointer"
              >
                <Printer className="w-5 h-5" />
                Cetak Sertifikat / Simpan PDF
              </button>
              <button
                onClick={() => setSelectedCert(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold py-3 px-6 rounded-2xl text-sm transition-colors uppercase tracking-wide cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ GLASSMORPHIC BOTTOM NAVIGATION BAR ══ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-gray-150 py-2 px-6 flex justify-around items-center shadow-lg rounded-t-2xl max-w-md mx-auto">
        <button
          onClick={() => setMainTab('home')}
          className={cn(
            "flex flex-col items-center py-1 cursor-pointer transition-colors bg-transparent border-0 outline-none",
            mainTab === 'home' ? 'text-emerald-700 font-extrabold' : 'text-gray-400'
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Beranda</span>
        </button>
        <button
          onClick={() => setMainTab('home_murajaah')}
          className={cn(
            "flex flex-col items-center py-1 cursor-pointer transition-colors bg-transparent border-0 outline-none",
            mainTab === 'home_murajaah' ? 'text-emerald-700 font-extrabold' : 'text-gray-400'
          )}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Muraja'ah</span>
        </button>
        <button
          onClick={() => setMainTab('komunikasi')}
          className={cn(
            "flex flex-col items-center py-1 cursor-pointer transition-colors bg-transparent border-0 outline-none",
            mainTab === 'komunikasi' ? 'text-emerald-700 font-extrabold' : 'text-gray-400'
          )}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Pesan</span>
        </button>
        <button
          onClick={() => setMainTab('sertifikat')}
          className={cn(
            "flex flex-col items-center py-1 cursor-pointer transition-colors bg-transparent border-0 outline-none",
            mainTab === 'sertifikat' ? 'text-emerald-700 font-extrabold' : 'text-gray-400'
          )}
        >
          <Award className="w-5 h-5" />
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Sertifikat</span>
        </button>
        <button
          onClick={() => setMainTab('password')}
          className={cn(
            "flex flex-col items-center py-1 cursor-pointer transition-colors bg-transparent border-0 outline-none",
            mainTab === 'password' ? 'text-emerald-700 font-extrabold' : 'text-gray-400'
          )}
        >
          <Key className="w-5 h-5" />
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Password</span>
        </button>
      </div>
    </div>
  );
};
