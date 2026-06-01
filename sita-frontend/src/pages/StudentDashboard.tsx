// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import {
  LogOut, BookOpen, Flame, ChevronRight, ChevronLeft, X, AlertCircle,
  Target, Eye, EyeOff, BarChart3, MessageSquare, Calendar,
  TrendingUp, Clock, CheckCircle2, XCircle, Star,
  Lightbulb, BookMarked, FileText, Trophy, Sparkles, PlayCircle, PauseCircle, Mic, Play, LayoutDashboard, History, Award, CheckCircle
} from 'lucide-react';
import { NotificationCenter } from '../components/NotificationCenter';
import { QURAN_PAGE_MAPPINGS } from '../lib/pageMappings';
import { useBranding } from '../context/BrandingContext';
import { calculateSpacedRepetition, calculateBadges } from '../lib/talaqqiUtils';
import {
  useStudentProgress,
  useSessions,
  useSurahs,
  useStudentHeatmap,
  useCertificates
} from '../hooks/useQueries';
import { HeaderOnlyFallback } from '../components/LoadingFallback';
import { SitaActivitiesSlider } from '../components/SitaActivitiesSlider';

// ── Juz → page ranges (Mushaf Madinah / King Fahd edition) ────────────────
const JUZ_PAGES: Record<number, { start: number; end: number }> = {
  1:  { start: 1,   end: 21  }, 2:  { start: 22,  end: 41  }, 3:  { start: 42,  end: 61  },
  4:  { start: 62,  end: 81  }, 5:  { start: 82,  end: 101 }, 6:  { start: 102, end: 121 },
  7:  { start: 122, end: 141 }, 8:  { start: 142, end: 161 }, 9:  { start: 162, end: 181 },
  10: { start: 182, end: 201 }, 11: { start: 202, end: 221 }, 12: { start: 222, end: 241 },
  13: { start: 242, end: 261 }, 14: { start: 262, end: 281 }, 15: { start: 282, end: 301 },
  16: { start: 302, end: 321 }, 17: { start: 322, end: 341 }, 18: { start: 342, end: 361 },
  19: { start: 362, end: 381 }, 20: { start: 382, end: 401 }, 21: { start: 402, end: 421 },
  22: { start: 422, end: 441 }, 23: { start: 442, end: 461 }, 24: { start: 462, end: 481 },
  25: { start: 482, end: 501 }, 26: { start: 502, end: 521 }, 27: { start: 522, end: 541 },
  28: { start: 542, end: 561 }, 29: { start: 562, end: 581 }, 30: { start: 582, end: 604 },
};

const JUZ_LABELS: Record<number, string> = {
  1: 'الم', 2: 'سيقول', 3: 'تلك الرسل', 4: 'لن تنالوا', 5: 'والمحصنات',
  6: 'لا يحب الله', 7: 'وإذا سمعوا', 8: 'ولو أننا', 9: 'قال الملأ',
  10: 'واعلموا', 11: 'يعتذرون', 12: 'وما من دابة', 13: 'وما أبرئ',
  14: 'ربما', 15: 'سبحان', 16: 'قال ألم', 17: 'اقترب', 18: 'قد أفلح',
  19: 'وقال الذين', 20: 'أمن خلق', 21: 'اتل ما أوحي', 22: 'ومن يقنت',
  23: 'وما لي', 24: 'فمن أظلم', 25: 'إليه يرد', 26: 'حم', 27: 'قال فما خطبكم',
  28: 'قد سمع الله', 29: 'تبارك الذي', 30: 'عم يتساءلون',
};

type TabKey = 'home' | 'ringkasan' | 'target' | 'mushaf' | 'catatan' | 'tasmi' | 'sertifikat';
type MushafMode = 'full' | 'blur' | 'hint';
type ErrorFilter = 'all' | 'jali' | 'khafi' | 'tark';

interface SavedTarget {
  juz: number;
  deadline: string;
  savedAt: string;
}

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = api.getUser();
  const { appName, appLogo, setPageTitle } = useBranding();

  // ── Tab ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  // ═══ TanStack Query — data fetching with caching ═══
  const studentId = user?.id || 0;
  const { data: stats, isLoading: isLoadingStats } = useStudentProgress(studentId);
  const { data: allSessions = [], isLoading: isLoadingSessions } = useSessions();
  const sessions = useMemo(() => allSessions.filter((s: any) => s.studentId === studentId), [allSessions, studentId]);
  const { data: surahs = [], isLoading: isLoadingSurahs } = useSurahs();
  const { data: certificates = [], isLoading: isLoadingCertificates } = useCertificates(studentId);
  const { data: heatmap = [] } = useStudentHeatmap(studentId);

  // ── All UI state — must come BEFORE any conditional return ────────────────
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [selectedSurah, setSelectedSurah] = useState<number | ''>('');
  const [heatmapMode, setHeatmapMode] = useState<'surah' | 'page'>('surah');
  const [selectedPage, setSelectedPage] = useState<number>(604);
  const [quranData, setQuranData] = useState<any>(null);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [logQuran, setLogQuran] = useState<any>(null);
  const [hoveredWord, setHoveredWord] = useState<any>(null);
  const [selectedInlineErrorKey, setSelectedInlineErrorKey] = useState<string | null>(null);
  const [inlineAyahData, setInlineAyahData] = useState<any>(null);
  const [inlineLoadingKey, setInlineLoadingKey] = useState<string | null>(null);

  const handleInlineErrorClick = (sessionId: string, errorIdx: number, err: any) => {
    const key = `${sessionId}-${errorIdx}`;
    if (selectedInlineErrorKey === key) {
      setSelectedInlineErrorKey(null);
      setInlineAyahData(null);
      return;
    }

    setSelectedInlineErrorKey(key);
    setInlineLoadingKey(key);
    setInlineAyahData(null);

    api.getAyahs(err.surahId, err.ayahId, err.ayahId)
      .then((res: any) => {
        if (res && res.ayahs && res.ayahs.length > 0) {
          setInlineAyahData({
            ayah_id: err.ayahId,
            words: res.ayahs[0].words
          });
        }
      })
      .catch((e) => {
        console.error("Gagal mengambil teks ayat inline:", e);
      })
      .finally(() => {
        setInlineLoadingKey(null);
      });
  };

  // ── Target Hafalan state ─────────────────────────────────────────────────
  const [targetJuz, setTargetJuz] = useState(30);
  const [targetDeadline, setTargetDeadline] = useState('');
  const [savedTarget, setSavedTarget] = useState<SavedTarget | null>(null);

  // ── Mushaf Menghafal state ───────────────────────────────────────────────
  const [mushafPage, setMushafPage] = useState(582);
  const [mushafMode, setMushafMode] = useState<MushafMode>('full');
  const [mushafFontSize, setMushafFontSize] = useState<number>(24);
  const [mushafSelectionMode, setMushafSelectionMode] = useState<'juz' | 'surah'>('juz');
  const [mushafSelectedJuz, setMushafSelectedJuz] = useState<number>(30);
  const [mushafSelectedSurah, setMushafSelectedSurah] = useState<number>(67);
  const [mushafAyahs, setMushafAyahs] = useState<any[]>([]);
  const [mushafSurahNames, setMushafSurahNames] = useState<Record<number, { nameAr: string; nameEn: string }>>({});
  const [mushafLoading, setMushafLoading] = useState(false);
  const [revealedAyahs, setRevealedAyahs] = useState<Set<number>>(new Set());
  const revealTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // Audio Player states & functions
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeAyahAudio, setActiveAyahAudio] = useState<{ surahId: number; ayahId: number } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingIndexRef = useRef<number>(0);

  const handleAudioEnded = () => {
    playAyahAtIndex(playingIndexRef.current + 1);
  };

  const playAyahAtIndex = (index: number) => {
    if (index < 0 || index >= mushafAyahs.length) {
      setIsPlayingAudio(false);
      setActiveAyahAudio(null);
      playingIndexRef.current = 0;
      return;
    }

    playingIndexRef.current = index;
    const ayah = mushafAyahs[index];
    setActiveAyahAudio({ surahId: ayah.surahId, ayahId: ayah.ayah_id });

    const reciter = 'Ghamadi_40kbps';
    const surahStr = String(ayah.surahId).padStart(3, '0');
    const ayahStr = String(ayah.ayah_id).padStart(3, '0');
    const url = `https://www.everyayah.com/data/${reciter}/${surahStr}${ayahStr}.mp3`;

    if (audioRef.current) {
      audioRef.current.src = url;
    } else {
      audioRef.current = new Audio(url);
      audioRef.current.addEventListener('ended', handleAudioEnded);
    }
    audioRef.current.play().catch(err => {
      console.error('Error playing audio:', err);
      playAyahAtIndex(index + 1);
    });
  };

  const playPageAudio = () => {
    if (mushafAyahs.length === 0) return;
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    playAyahAtIndex(playingIndexRef.current);
  };

  const stopPageAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlayingAudio(false);
    setActiveAyahAudio(null);
    playingIndexRef.current = 0;
  };

  const getJuzForPage = (page: number): number => {
    if (page >= 1 && page <= 21) return 1;
    if (page >= 582 && page <= 604) return 30;
    return Math.floor((page - 22) / 20) + 2;
  };

  // Stop audio if page changes
  useEffect(() => {
    stopPageAudio();
  }, [mushafPage]);

  // Cleanup audio listener on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        const curAudio = audioRef.current;
        curAudio.removeEventListener('ended', handleAudioEnded);
      }
    };
  }, []);

  const getPagesForJuz = (juzId: number): number[] => {
    const range = JUZ_PAGES[juzId];
    if (!range) return [];
    const pages = [];
    for (let p = range.start; p <= range.end; p++) {
      pages.push(p);
    }
    return pages;
  };

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

  const availableJuz = useMemo<number[]>(() => {
    const u = api.getUser();
    if (!u?.level?.juzList) return Array.from({ length: 30 }, (_, i) => i + 1);
    const parsed = u.level.juzList.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
    return parsed.length > 0 ? parsed.sort((a: number, b: number) => a - b) : Array.from({ length: 30 }, (_, i) => i + 1);
  }, []);

  const availableSurahs = useMemo(() => {
    if (availableJuz.length === 30) return surahs;
    return surahs.filter(s => {
      const pagesForSurah = getPagesForSurah(s.id);
      return pagesForSurah.some(p => 
        availableJuz.some((juz: number) => p >= JUZ_PAGES[juz].start && p <= JUZ_PAGES[juz].end)
      );
    });
  }, [surahs, availableJuz]);

  const spacedRepetitionPages = useMemo(() => {
    return calculateSpacedRepetition(sessions, availableJuz);
  }, [sessions, availableJuz]);

  const badges = useMemo(() => {
    return calculateBadges(sessions);
  }, [sessions]);

  const levelProgressPct = useMemo(() => {
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
      return 30;
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
      return [];
    };

    const getTotalPagesInJuz = (juz: number) => {
      if (juz === 1) return 21;
      if (juz === 30) return 23;
      return 20;
    };

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

  // ── Catatan Kesalahan filter state ───────────────────────────────────────
  const [errorFilter, setErrorFilter] = useState<ErrorFilter>('all');
  const [showOnlyWithNotes, setShowOnlyWithNotes] = useState(false);

  useEffect(() => {
    setPageTitle(
      activeTab === 'ringkasan' ? 'Dashboard Santri'
        : activeTab === 'target' ? 'Target Hafalan'
        : activeTab === 'mushaf' ? 'Mushaf Menghafal'
        : activeTab === 'catatan' ? 'Catatan Ustadz'
        : activeTab === 'tasmi' ? 'Riwayat Tasmi'
        : 'Sertifikat Emas'
    );
  }, [activeTab, appName]);

  // ── Load initial data ────────────────────────────────────────────────────
  useEffect(() => {
    const currentUser = api.getUser();
    if (!currentUser || currentUser.role !== 'student') {
      navigate('/login');
      return;
    }
    const saved = localStorage.getItem(`sita_target_${currentUser.id}`);
    if (saved) setSavedTarget(JSON.parse(saved));
  }, [navigate]);

  // ── Heatmap & quran text when surah/page changes ──────────────────────────
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

  // ── Session replay quran text ────────────────────────────────────────────
  useEffect(() => {
    if (!selectedLog) return;

    const isJuzOrPageSession = selectedLog.juzId !== null || selectedLog.startPage !== null || selectedLog.pageNumber !== null;

    if (isJuzOrPageSession) {
      let pagesToLoad: number[] = [];
      if (selectedLog.startPage !== null && selectedLog.endPage !== null) {
        for (let p = Number(selectedLog.startPage); p <= Number(selectedLog.endPage); p++) {
          pagesToLoad.push(p);
        }
      } else if (selectedLog.pageNumber !== null) {
        pagesToLoad = [Number(selectedLog.pageNumber)];
      } else if (selectedLog.juzId !== null) {
        pagesToLoad = getPagesForJuz(Number(selectedLog.juzId));
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

          setMushafSurahNames((prev) => ({ ...prev, ...namesMap }));

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
        .then(setLogQuran).catch(console.error);
    }
  }, [selectedLog]);

  // ── Load mushaf page ─────────────────────────────────────────────────────
  useEffect(() => {
    const ranges = QURAN_PAGE_MAPPINGS[mushafPage];
    if (!ranges || ranges.length === 0) return;
    setMushafLoading(true);
    setRevealedAyahs(new Set());
    Object.values(revealTimers.current).forEach(clearTimeout);
    revealTimers.current = {};

    Promise.all(ranges.map(r => api.getAyahs(r.surahId, r.startAyah, r.endAyah)))
      .then(results => {
        const merged: any[] = [];
        const namesMap: Record<number, { nameAr: string; nameEn: string }> = {};
        results.forEach(res => {
          namesMap[res.surah_id] = { nameAr: res.surah_name_ar, nameEn: res.surah_name_id };
          res.ayahs.forEach((a: any) => merged.push({ ...a, surahId: res.surah_id }));
        });
        setMushafAyahs(merged);
        setMushafSurahNames(namesMap);
        setMushafLoading(false);
      })
      .catch(err => { console.error(err); setMushafLoading(false); });
  }, [mushafPage]);

  // \u2500\u2500 Handlers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // All hooks have been declared above. Now we can do conditional early return.
  const isInitialLoading = isLoadingStats || isLoadingSessions || isLoadingSurahs || isLoadingCertificates;
  if (isInitialLoading) {
    return <HeaderOnlyFallback />;
  }

  const handleLogout = () => { api.logout(); navigate('/login'); };

  const getHeatmapColor = (count: number) => {
    if (count === 0) return '';
    if (count <= 2) return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border-b-2 border-yellow-300';
    if (count <= 5) return 'bg-orange-100 hover:bg-orange-200 text-orange-900 border-b-2 border-orange-300';
    if (count <= 10) return 'bg-red-100 hover:bg-red-200 text-red-950 border-b-2 border-red-300';
    return 'bg-red-500 hover:bg-red-600 text-white font-bold border-b-2 border-red-700';
  };

  const getWordStats = (surahId: number, ayahId: number, wordIdx: number) =>
    heatmap.find(h => h.surahId === surahId && h.ayahId === ayahId && h.wordIndex === wordIdx);

  // ── Target Hafalan helpers ────────────────────────────────────────────────
  const saveTarget = () => {
    if (!targetDeadline) return;
    const target: SavedTarget = { juz: targetJuz, deadline: targetDeadline, savedAt: new Date().toISOString() };
    localStorage.setItem(`sita_target_${user?.id}`, JSON.stringify(target));
    setSavedTarget(target);
  };

  const clearTarget = () => {
    localStorage.removeItem(`sita_target_${user?.id}`);
    setSavedTarget(null);
  };

  const computeTargetStats = () => {
    if (!savedTarget) return null;
    const juzRange = JUZ_PAGES[savedTarget.juz];
    const totalPages = juzRange.end - juzRange.start + 1;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const deadline = new Date(savedTarget.deadline);
    const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / 86400000));

    const passedPages = new Set<number>();
    sessions.forEach(s => {
      if (s.juzId === savedTarget.juz && s.status === 'lulus') {
        if (s.pageNumber) passedPages.add(s.pageNumber);
        else if (s.startPage && s.endPage)
          for (let p = s.startPage; p <= s.endPage; p++) passedPages.add(p);
      }
    });

    const donePages = Math.min(passedPages.size, totalPages);
    const remainingPages = Math.max(0, totalPages - donePages);
    const pagesPerDay = daysLeft > 0 ? Math.ceil(remainingPages / daysLeft) : remainingPages;
    const progressPct = Math.round((donePages / totalPages) * 100);
    return { totalPages, daysLeft, donePages, remainingPages, pagesPerDay, progressPct };
  };

  // ── Mushaf blur/reveal ────────────────────────────────────────────────────
  const handleAyahReveal = (ayahId: number) => {
    if (mushafMode !== 'blur') return;
    setRevealedAyahs(prev => {
      const next = new Set(prev);
      if (next.has(ayahId)) {
        next.delete(ayahId);
        clearTimeout(revealTimers.current[ayahId]);
      } else {
        next.add(ayahId);
        clearTimeout(revealTimers.current[ayahId]);
        revealTimers.current[ayahId] = setTimeout(() => {
          setRevealedAyahs(p => { const n = new Set(p); n.delete(ayahId); return n; });
        }, 4000);
      }
      return next;
    });
  };

  // ── Catatan filter ────────────────────────────────────────────────────────
  const filteredSessions = sessions.filter(s => {
    if (showOnlyWithNotes && !s.notesUstadz) return false;
    if (errorFilter === 'jali') return s.errorJaliCount > 0;
    if (errorFilter === 'khafi') return s.errorKhafiCount > 0;
    if (errorFilter === 'tark') return s.errorTarkCount > 0;
    return true;
  });

  const targetStats = computeTargetStats();
  const todayStr = new Date().toISOString().split('T')[0];

  const tabs = [
    { key: 'ringkasan' as TabKey, label: 'Ringkasan', icon: BarChart3 },
    { key: 'target'    as TabKey, label: 'Target Hafalan', icon: Target },
    { key: 'mushaf'   as TabKey, label: 'Mushaf Menghafal', icon: BookOpen },
    { key: 'catatan'   as TabKey, label: 'Catatan Ustadz', icon: FileText },
    { key: 'tasmi'    as TabKey, label: 'Riwayat Tasmi', icon: Mic },
    { key: 'sertifikat' as TabKey, label: 'Sertifikat Emas', icon: Award },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">

      {/* ══ MOBILE FIRST HEADER (On Home Tab Only) ══ */}
      {activeTab === 'home' && (
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
                <h1 className="font-extrabold text-[9px] tracking-widest text-emerald-200 uppercase leading-none">{appName} Santri</h1>
                <p className="font-serif font-black text-white text-base mt-0.5 leading-none">An Nahl Islamic School</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <NotificationCenter />
              <button
                onClick={handleLogout}
                className="p-2 bg-white/10 hover:bg-white/25 rounded-full text-white backdrop-blur-md transition-all shadow-sm cursor-pointer border-0 bg-transparent outline-none"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Student Profile Capsule (Read-only translucent info block) */}
          <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <span className="text-[8px] uppercase font-black tracking-widest text-emerald-200 block">Santri Aktif:</span>
              <p className="text-xs font-black text-white leading-tight">{user?.name}</p>
              <p className="text-[9px] text-emerald-100 font-medium">NIS: {user?.nis}</p>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[8px] uppercase font-black tracking-widest text-emerald-200 block">Halaqah & Pembina:</span>
              <p className="text-xs font-black text-white leading-none">{user?.level?.name || 'Halaqah Tahfidz'}</p>
              <p className="text-[9px] text-emerald-100 font-medium">{stats?.musyrifName || user?.musyrifName || 'Ustadz Pembina'}</p>
            </div>
          </div>
        </header>
      )}

      {/* ══ FLOATING KEMBALI HEADER (On Feature Tabs Only) ══ */}
      {activeTab !== 'home' && (
        <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-3 sticky top-0 z-30 shadow-sm flex items-center justify-between w-full">
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center space-x-2 text-emerald-800 font-bold hover:text-emerald-950 transition-colors cursor-pointer bg-transparent border-0 outline-none"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-black uppercase tracking-wider">Kembali ke Beranda</span>
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-gray-400 text-right">
            {activeTab === 'ringkasan' && "MUTABA'AH & RAPOR"}
            {activeTab === 'target' && "TARGET HAFALAN"}
            {activeTab === 'mushaf' && "MUSHAF TILAWAH"}
            {activeTab === 'catatan' && "CATATAN USTADZ"}
            {activeTab === 'tasmi' && "RIWAYAT UJIAN & TASMI'"}
            {activeTab === 'sertifikat' && "SERTIFIKAT EMAS"}
          </span>
        </div>
      )}

      <main className={cn(
        activeTab === 'home'
          ? "w-full -mt-12 px-4 md:px-8 pb-24 z-20 relative animate-fadeIn"
          : "w-full px-4 md:px-8 mt-6"
      )}>

        {/* ══ PORTAL HOME (MOBILE FIRST PORTAL) ══ */}
        {activeTab === 'home' && (
          <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start space-y-6 md:space-y-0">
            {/* Left Column: Progress, Grid Menu, Tagihan */}
            <div className="space-y-6">
              {/* Student Summary & Progress Card */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1 text-left flex-1 min-w-0">
                    <span className="text-[9px] uppercase font-black tracking-widest text-emerald-600 block">Level Target Hafalan</span>
                    <h3 className="text-base font-black text-gray-800 tracking-tight leading-tight truncate">
                      {user?.level?.name || 'Level Target'}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      {user?.level?.juzCount || 0} Juz Target
                    </p>
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

              {/* Grid Menu Portal (3x2 Grid for Student) */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 text-left">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider px-2 mb-3">Layanan SITA Santri</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {/* Ringkasan */}
                  <button
                    onClick={() => setActiveTab('ringkasan')}
                    className="flex flex-col items-center p-2.5 rounded-2xl hover:bg-emerald-50 transition-colors group cursor-pointer border-0 bg-transparent outline-none"
                  >
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-700 mt-2 leading-tight block">Rapor</span>
                  </button>

                  {/* Mushaf */}
                  <button
                    onClick={() => setActiveTab('mushaf')}
                    className="flex flex-col items-center p-2.5 rounded-2xl hover:bg-orange-50 transition-colors group cursor-pointer border-0 bg-transparent outline-none"
                  >
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-700 mt-2 leading-tight block">Mushaf</span>
                  </button>

                  {/* Target */}
                  <button
                    onClick={() => setActiveTab('target')}
                    className="flex flex-col items-center p-2.5 rounded-2xl hover:bg-amber-50 transition-colors group cursor-pointer border-0 bg-transparent outline-none"
                  >
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Target className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-700 mt-2 leading-tight block">Target</span>
                  </button>

                  {/* Catatan */}
                  <button
                    onClick={() => setActiveTab('catatan')}
                    className="flex flex-col items-center p-2.5 rounded-2xl hover:bg-purple-50 transition-colors group cursor-pointer border-0 bg-transparent outline-none"
                  >
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-700 mt-2 leading-tight block">Evaluasi</span>
                  </button>

                  {/* Tasmi' */}
                  <button
                    onClick={() => setActiveTab('tasmi')}
                    className="flex flex-col items-center p-2.5 rounded-2xl hover:bg-indigo-50 transition-colors group cursor-pointer border-0 bg-transparent outline-none"
                  >
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Mic className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-700 mt-2 leading-tight block">Tasmi'</span>
                  </button>

                  {/* Sertifikat */}
                  <button
                    onClick={() => setActiveTab('sertifikat')}
                    className="flex flex-col items-center p-2.5 rounded-2xl hover:bg-rose-50 transition-colors group cursor-pointer border-0 bg-transparent outline-none"
                  >
                    <div className="w-12 h-12 bg-rose-50 text-rose-605 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Award className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-700 mt-2 leading-tight block">Sertifikat</span>
                  </button>
                </div>
              </div>


            </div>

            {/* Right Column: Karusel, Jadwal Sholat */}
            <div className="space-y-6">
              {/* Karusel Dokumentasi & Badges */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-3 text-left">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider px-2">Dokumentasi Kegiatan & Penghargaan</h4>
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
                <div className="relative flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                  <div>
                    <h3 className="font-extrabold text-sm tracking-tight text-amber-100">Jadwal Sholat Hari Ini</h3>
                    <p className="text-[9px] text-amber-200/70 font-semibold mt-0.5">Bogor, West Java • 27 Mei 2026</p>
                  </div>
                  <span className="text-[10px] bg-white/10 border border-white/10 py-1 px-2.5 rounded-full font-bold uppercase tracking-wider">FARDHU</span>
                </div>
                <div className="grid grid-cols-5 gap-2 relative z-10">
                  {[
                    { name: 'Subuh', time: '04:36' },
                    { name: 'Dzuhur', time: '11:52' },
                    { name: 'Ashar', time: '15:15' },
                    { name: 'Maghrib', time: '17:46' },
                    { name: 'Isya', time: '19:00' }
                  ].map((p) => (
                    <div key={p.name} className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-xl py-2 px-1 text-center">
                      <span className="text-[8px] font-black uppercase text-amber-200 tracking-wider leading-none">{p.name}</span>
                      <span className="text-xs font-extrabold text-white mt-1.5 leading-none">{p.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 1: RINGKASAN ═════════════════════════════════════════════ */}
        {activeTab === 'ringkasan' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left column */}
            <div className="lg:col-span-1 space-y-5">
              {user?.level && (
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-3xl p-6 text-white shadow-lg shadow-emerald-100/50 relative overflow-hidden">
                  {/* Glowing background circles for visual depth */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl"></div>

                  <div className="flex items-center justify-between gap-4">
                    {/* Left: Level Info */}
                    <div className="space-y-4 flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner shrink-0">
                          <Target className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest truncate">Level Target Hafalan</p>
                          <h4 className="text-base font-black tracking-tight leading-tight mt-0.5 truncate">{user.level.name}</h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20">
                        <div className="min-w-0">
                          <p className="text-[9px] text-emerald-250 font-bold uppercase tracking-wider">Cakupan</p>
                          <p className="text-[11px] font-extrabold mt-0.5 truncate" title={`${user.level.juzCount} Juz (${user.level.juzList.split(',').map((j: string) => `Juz ${j}`).join(', ')})`}>
                            {user.level.juzCount} Juz ({user.level.juzList.split(',').map((j: string) => `Juz ${j}`).join(', ')})
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-emerald-250 font-bold uppercase tracking-wider">Target Waktu</p>
                          <p className="text-[11px] font-extrabold mt-0.5">{user.level.targetDays} Hari</p>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center space-x-3">
                  <div className="w-11 h-11 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center flex-shrink-0"><Flame className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Streak</p>
                    <p className="text-xl font-extrabold text-gray-800">{stats?.currentStreak || 0} Hari</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center space-x-3">
                  <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0"><BookOpen className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Sesi</p>
                    <p className="text-xl font-extrabold text-gray-800">{stats?.totalSessions || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-extrabold text-gray-800 mb-4">Tingkat Kelulusan</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 font-semibold">Lulus</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {stats?.totalSessions ? Math.round((stats.passedSessions / stats.totalSessions) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-emerald-500 h-3 rounded-full transition-all" style={{ width: `${stats?.totalSessions ? (stats.passedSessions / stats.totalSessions) * 100 : 0}%` }} />
                </div>
                <p className="text-xs text-gray-400 font-semibold mt-3">
                  {stats?.passedSessions || 0} dari {stats?.totalSessions || 0} sesi dinyatakan LULUS.
                </p>
              </div>

              {/* Session log */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-50">
                  <h3 className="font-extrabold text-gray-800">Riwayat Setoran</h3>
                </div>
                <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
                  {sessions.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Belum ada riwayat setoran.</div>
                  ) : sessions.map(log => (
                    <div key={log.id} onClick={() => setSelectedLog(log)} className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{log.juzId ? `Juz ${log.juzId}` : `Surah ${log.surahId}`}</p>
                        <p className="text-xs text-gray-400 font-medium">{new Date(log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <span className="text-sm font-black text-gray-800">{log.scoreFinal}</span>
                          <div className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5', log.status === 'lulus' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
                            {log.status.toUpperCase()}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column: Heatmap */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-4 mb-5 gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800">Peta Kesalahan (Quran Error Map)</h2>
                  <p className="text-xs text-gray-400 font-medium">Analisis frekuensi kata yang sering keliru pada surah atau halaman pilihan.</p>
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
                  <span className="text-gray-400 italic text-xs">Arahkan kursor ke kata Al-Qur'an untuk melihat riwayat kesalahan.</span>
                )}
              </div>

              {!selectedSurah ? (
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-16 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-xs">
                    <BookOpen className="w-8 h-8 opacity-50" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Pilih Surah untuk Dianalisis</h3>
                  <p className="text-gray-500 text-sm max-w-sm">
                    Pilih surah dari menu di atas untuk memuat teks Al-Qur'an dan melihat peta panas (heatmap) riwayat kesalahan bacaan Anda.
                  </p>
                </div>
              ) : quranData ? (
                <div className="relative bg-[#fbf9f4] rounded-[24px] shadow-lg border-2 border-emerald-800/80 p-6 md:p-8 overflow-y-auto max-h-[500px] transition-all overflow-hidden">

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
                          (ayah.words[0].text.includes("بِسْمِ") || ayah.words[0].text.includes("بسم"));

                        if (isSurah1 && isFirstAyah) {
                          return (
                            <React.Fragment key={ayah.id}>
                              {/* Surah Start Banner */}
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

                              {/* Centered Bismillah for Surah 1 Ayah 1 */}
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
                                {/* Ayah Marker */}
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
                            {/* Surah Start Banner */}
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

                            {/* Centered Bismillah Header for other Surahs */}
                            {hasBismillahPrefix && (
                              <div className="w-full text-center my-4 block font-serif font-semibold text-emerald-950/95 leading-normal select-none" dir="rtl">
                                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                              </div>
                            )}

                            {/* Words */}
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

                            {/* Ayah Marker */}
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

            {/* Rekomendasi Murajaah & Badge Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* 1. Rekomendasi Murajaah Card */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-800 text-sm md:text-base">Rekomendasi Murajaah Harian</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Berdasarkan Quran Error Map</p>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  {spacedRepetitionPages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                      <span className="text-3xl mb-2">⭐</span>
                      <p className="text-sm font-bold text-emerald-800">Maa Syaa Allah!</p>
                      <p className="text-xs text-emerald-600/80 font-medium max-w-[200px] mt-1">Hafalan Anda saat ini sangat mutqin. Teruskan Ziyadah!</p>
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
                            const pageJuz = getJuzForPage(item.pageNumber);
                            setMushafSelectionMode('juz');
                            setMushafSelectedJuz(pageJuz);
                            setMushafPage(item.pageNumber);
                            setActiveTab('mushaf');
                          }}
                          className="py-1 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          Buka Mushaf
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 2. Badge Gallery Card */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-800 text-sm md:text-base">Badge Penghargaan</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fastabiqul Khairat</p>
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
          </div>
          </div>
        )}

        {/* ══ TAB 2: TARGET HAFALAN ════════════════════════════════════════ */}
        {activeTab === 'target' && (
          <div className="w-full max-w-4xl mx-auto space-y-6">

            {/* Hero */}
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-600 rounded-3xl p-8 text-white shadow-lg shadow-emerald-200 relative overflow-hidden">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Target Hafalan</h2>
                  <p className="text-emerald-200 text-xs font-medium">Rencanakan perjalanan hafalan Anda</p>
                </div>
              </div>
              <p className="text-emerald-100 text-sm leading-relaxed">
                Tentukan Juz target dan batas waktu penyelesaian. Sistem akan menghitung secara otomatis berapa halaman yang harus Anda setor setiap harinya.
              </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 space-y-6">
              <h3 className="font-extrabold text-gray-800 text-lg flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>Atur Target Baru</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2 block">Pilih Juz Target</label>
                  <select
                    value={targetJuz}
                    onChange={e => setTargetJuz(parseInt(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                      <option key={j} value={j}>Juz {j} — {JUZ_LABELS[j]}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1.5 font-medium">
                    Halaman {JUZ_PAGES[targetJuz].start}–{JUZ_PAGES[targetJuz].end} ({JUZ_PAGES[targetJuz].end - JUZ_PAGES[targetJuz].start + 1} halaman)
                  </p>
                </div>
                <div>
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2 block">Target Selesai</label>
                  <input
                    type="date"
                    value={targetDeadline}
                    onChange={e => setTargetDeadline(e.target.value)}
                    min={todayStr}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              {/* Live preview */}
              {targetDeadline && (() => {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const dl = new Date(targetDeadline);
                const days = Math.max(1, Math.ceil((dl.getTime() - today.getTime()) / 86400000));
                const pages = JUZ_PAGES[targetJuz].end - JUZ_PAGES[targetJuz].start + 1;
                const perDay = Math.ceil(pages / days);
                return (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100 flex items-start space-x-3">
                    <Lightbulb className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-emerald-800 font-semibold">
                      <p>Dalam <strong>{days} hari</strong>, target menyelesaikan <strong>{pages} halaman</strong> Juz {targetJuz}.</p>
                      <p className="mt-1">Rekomendasi harian: <span className="inline-block bg-emerald-600 text-white px-2.5 py-0.5 rounded-lg font-black text-xs">±{perDay} halaman/hari</span></p>
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={saveTarget}
                disabled={!targetDeadline}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl transition-all shadow-sm shadow-emerald-200 active:scale-[0.98] text-sm"
              >
                {savedTarget ? '🔄 Perbarui Target' : '🎯 Simpan Target'}
              </button>
            </div>

            {/* Active target dashboard */}
            {savedTarget && targetStats && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-gray-800 text-lg flex items-center space-x-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    <span>Target Aktif — Juz {savedTarget.juz} ({JUZ_LABELS[savedTarget.juz]})</span>
                  </h3>
                  <button onClick={clearTarget} className="text-xs text-red-400 hover:text-red-600 font-bold px-3 py-1.5 rounded-xl hover:bg-red-50 transition-all">
                    Hapus
                  </button>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Sisa Hari', val: targetStats.daysLeft, unit: 'hari', color: targetStats.daysLeft <= 7 ? 'text-red-600' : 'text-blue-700', bg: targetStats.daysLeft <= 7 ? 'bg-red-50' : 'bg-blue-50', Icon: Clock },
                    { label: 'Halaman Selesai', val: targetStats.donePages, unit: `dari ${targetStats.totalPages} hal`, color: 'text-emerald-700', bg: 'bg-emerald-50', Icon: CheckCircle2 },
                    { label: 'Sisa Halaman', val: targetStats.remainingPages, unit: 'halaman', color: 'text-gray-700', bg: 'bg-gray-50', Icon: BookMarked },
                    { label: 'Target/Hari', val: targetStats.pagesPerDay, unit: 'hal/hari', color: 'text-violet-700', bg: 'bg-violet-50', Icon: TrendingUp },
                  ].map(({ label, val, unit, color, bg, Icon }) => (
                    <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
                      <Icon className={`w-5 h-5 ${color} mx-auto mb-1.5`} />
                      <p className={`text-2xl font-black ${color}`}>{val}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide leading-tight mt-0.5">{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{unit}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                    <span>Progress Hafalan Juz {savedTarget.juz}</span>
                    <span className="text-emerald-600">{targetStats.progressPct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(targetStats.progressPct, 2)}%` }}
                    >
                      {targetStats.progressPct >= 15 && (
                        <span className="text-[10px] font-black text-white">{targetStats.progressPct}%</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Batas waktu: {new Date(savedTarget.deadline).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Motivation */}
                <div className={cn(
                  'rounded-2xl p-4 border text-sm font-semibold flex items-start space-x-3',
                  targetStats.daysLeft === 0 ? 'bg-red-50 border-red-100 text-red-800' :
                  targetStats.progressPct >= 80 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                  'bg-amber-50 border-amber-100 text-amber-800'
                )}>
                  <span className="text-xl mt-0.5 flex-shrink-0">
                    {targetStats.daysLeft === 0 ? '⏰' : targetStats.progressPct >= 80 ? '🎉' : '💪'}
                  </span>
                  <span>
                    {targetStats.daysLeft === 0
                      ? 'Waktu target telah habis. Tetap semangat dan lanjutkan hafalan!'
                      : targetStats.progressPct >= 80
                      ? 'Luar biasa! Hampir selesai — tinggal sedikit lagi untuk mencapai target Anda!'
                      : `Semangat! Setor sekitar ${targetStats.pagesPerDay} halaman per hari agar target tercapai tepat waktu.`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB 3: MUSHAF MENGHAFAL ═════════════════════════════════════ */}
        {activeTab === 'mushaf' && (
          <div className="w-full max-w-4xl mx-auto space-y-4">

            {/* Controls panel */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">

              {/* Selector for Juz vs Surah */}
              <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200/80 gap-1 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setMushafSelectionMode('juz');
                    setMushafPage(JUZ_PAGES[mushafSelectedJuz].start);
                  }}
                  className={cn(
                    'flex-1 text-center py-2 text-xs font-black rounded-lg transition-all cursor-pointer',
                    mushafSelectionMode === 'juz'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-805 hover:bg-gray-100'
                  )}
                >
                  Berdasarkan Juz
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMushafSelectionMode('surah');
                    const pages = getPagesForSurah(mushafSelectedSurah);
                    if (pages.length > 0) setMushafPage(pages[0]);
                  }}
                  className={cn(
                    'flex-1 text-center py-2 text-xs font-black rounded-lg transition-all cursor-pointer',
                    mushafSelectionMode === 'surah'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-805 hover:bg-gray-100'
                  )}
                >
                  Berdasarkan Surah
                </button>
              </div>

              {/* Selection row: Juz / Surah + Page selector in filtered range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mushafSelectionMode === 'juz' ? (
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5 block">Pilih Juz</label>
                    <select
                      value={mushafSelectedJuz}
                      onChange={e => {
                        const newJuz = parseInt(e.target.value);
                        setMushafSelectedJuz(newJuz);
                        setMushafPage(JUZ_PAGES[newJuz].start);
                      }}
                      className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-sm font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {availableJuz.map((j: number) => (
                        <option key={j} value={j}>Juz {j} — {JUZ_LABELS[j]}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5 block">Pilih Surah</label>
                    <select
                      value={mushafSelectedSurah}
                      onChange={e => {
                        const newSurah = parseInt(e.target.value);
                        setMushafSelectedSurah(newSurah);
                        const pages = getPagesForSurah(newSurah);
                        if (pages.length > 0) setMushafPage(pages[0]);
                      }}
                      className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-sm font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {availableSurahs.map(s => (
                        <option key={s.id} value={s.id}>{s.id}. {s.nameEn} ({s.nameAr})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5 block">Halaman Mushaf</label>
                  {(() => {
                    const currentPagesList = mushafSelectionMode === 'juz'
                      ? getPagesForJuz(mushafSelectedJuz)
                      : getPagesForSurah(mushafSelectedSurah);
                    return (
                      <select
                        value={mushafPage}
                        onChange={e => setMushafPage(parseInt(e.target.value))}
                        className="w-full bg-emerald-50 border border-emerald-250 rounded-xl px-3 py-2 text-sm font-bold text-emerald-805 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm transition-all"
                      >
                        {currentPagesList.map(p => (
                          <option key={p} value={p}>Halaman {p}</option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              </div>

              {/* Mode selector */}
              <div>
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">Mode Tampilan</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { mode: 'full' as MushafMode, label: 'Tampil Penuh', Icon: Eye, desc: 'Semua ayat terlihat' },
                    { mode: 'blur' as MushafMode, label: 'Samarkan', Icon: EyeOff, desc: 'Tap ayat untuk lihat' },
                    { mode: 'hint' as MushafMode, label: 'Kata Pertama', Icon: Lightbulb, desc: 'Petunjuk awal saja' },
                  ]).map(({ mode, label, Icon, desc }) => (
                    <button
                      key={mode}
                      onClick={() => { setMushafMode(mode); setRevealedAyahs(new Set()); }}
                      className={cn(
                        'p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer',
                        mushafMode === mode
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-extrabold">{label}</span>
                      <span className="text-[10px] text-gray-400 hidden sm:block leading-tight">{desc}</span>
                    </button>
                  ))}
                </div>

                {mushafMode === 'blur' && (
                  <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-center space-x-2">
                    <span className="text-base">💡</span>
                    <p className="text-xs text-amber-700 font-medium">Tap/klik pada ayah untuk menampilkan sementara (4 detik). Tap lagi untuk menyembunyikan.</p>
                  </div>
                )}
                {mushafMode === 'hint' && (
                  <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center space-x-2">
                    <span className="text-base">💡</span>
                    <p className="text-xs text-blue-700 font-medium">Hanya dua kata pertama setiap ayah yang terlihat. Gunakan sebagai petunjuk awal hafalan.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Header Panel: Font Size Adjuster & Audio Player */}
            <div className="flex justify-between items-center select-none">
              <span className="text-xs text-emerald-800 font-extrabold uppercase tracking-wider flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-600 mr-1.5 animate-pulse"></span>
                Mode Mushaf Madinah
              </span>
              
              <div className="flex items-center space-x-3">
                {/* Audio Player Controls */}
                <div className="flex items-center space-x-1.5 bg-emerald-50/50 p-1.5 rounded-xl border border-emerald-100">
                  <button
                    type="button"
                    onClick={playPageAudio}
                    className="p-1 text-emerald-850 hover:text-emerald-950 transition-all active:scale-90 cursor-pointer flex items-center justify-center"
                    title={isPlayingAudio ? "Pause Audio" : "Putar Audio Halaman"}
                  >
                    {isPlayingAudio ? (
                      <PauseCircle className="w-5 h-5 text-amber-500 fill-amber-100/30" />
                    ) : (
                      <PlayCircle className="w-5 h-5 text-emerald-600 fill-emerald-100/30" />
                    )}
                  </button>
                  {isPlayingAudio && (
                    <button
                      type="button"
                      onClick={stopPageAudio}
                      className="p-1 text-red-500 hover:text-red-750 transition-all active:scale-90 cursor-pointer flex items-center justify-center animate-fadeIn"
                      title="Hentikan Audio"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                  <span className="text-[10px] font-extrabold text-emerald-800 px-1 select-none">
                    {isPlayingAudio ? "Memutar..." : "Audio"}
                  </span>
                </div>

                {/* Font Size Adjuster */}
                <div className="flex items-center space-x-2 bg-emerald-50/50 p-1.5 rounded-xl border border-emerald-100">
                  <button
                    type="button"
                    onClick={() => setMushafFontSize((prev) => Math.max(16, prev - 2))}
                    className="px-2.5 py-1 text-xs font-black bg-white hover:bg-emerald-100/55 text-emerald-855 rounded-lg shadow-sm border border-emerald-200 transition-all active:scale-95 cursor-pointer"
                    title="Kecilkan Font"
                  >
                    A-
                  </button>
                  <span className="text-xs font-bold text-emerald-800 px-1">{mushafFontSize}px</span>
                  <button
                    type="button"
                    onClick={() => setMushafFontSize((prev) => Math.min(48, prev + 2))}
                    className="px-2.5 py-1 text-xs font-black bg-white hover:bg-emerald-100/55 text-emerald-855 rounded-lg shadow-sm border border-emerald-200 transition-all active:scale-95 cursor-pointer"
                    title="Besarkan Font"
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>

            {/* ── Mushaf Sheet: styled exactly like QuranReader ── */}
            <div className="bg-[#fbf9f4] rounded-[28px] shadow-2xl border-4 border-emerald-800/95 p-8 md:p-12 relative overflow-hidden">

              {mushafLoading ? (
                <div className="flex flex-col items-center justify-center h-52 space-y-3 text-gray-400">
                  <div className="w-8 h-8 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                  <p className="text-sm font-medium">Memuat halaman mushaf...</p>
                </div>
              ) : (
                /* ── Main text block: full-width justify like real mushaf ── */
                <div
                  className="relative text-justify quran-text drop-shadow-sm leading-loose"
                  style={{ fontSize: `${mushafFontSize}px`, lineHeight: 2.6 }}
                  dir="rtl"
                >
                  {mushafAyahs.map((ayah) => {
                    const isFirstAyahOfSurah = ayah.ayah_id === 1;
                    const isRevealed = revealedAyahs.has(ayah.id);
                    
                    const isSurah1 = ayah.surahId === 1;
                    const isSurah9 = ayah.surahId === 9;
                    
                    const hasBismillahPrefix = isFirstAyahOfSurah && !isSurah1 && !isSurah9 && ayah.words && ayah.words.length >= 4 && 
                      (ayah.words[0].text.includes("بِسْمِ") || ayah.words[0].text.includes("بسم"));

                    // If it is Surah 1 Ayah 1, it's just the Bismillah itself. We render it centered.
                    if (isSurah1 && isFirstAyahOfSurah) {
                      return (
                        <React.Fragment key={ayah.id}>
                          {/* Surah Start Banner */}
                          <div className="w-full text-center my-6 select-none block" dir="ltr">
                            <div className="inline-block w-full max-w-lg bg-gradient-to-r from-emerald-800/10 via-emerald-850/5 to-emerald-800/10 border-y-2 border-emerald-800/20 py-3 px-6 rounded-md">
                              <h3 className="font-serif font-black text-emerald-950 text-xl md:text-2xl quran-text">
                                {mushafSurahNames[ayah.surahId]?.nameAr || 'سورة الفاتحة'}
                              </h3>
                              <p className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-800 mt-1">
                                Surah {mushafSurahNames[ayah.surahId]?.nameEn || 'Al-Fatihah'}
                              </p>
                            </div>
                          </div>

                          {/* Centered Bismillah for Surah 1 Ayah 1 */}
                          <div className={cn(
                            "w-full text-center my-6 block font-serif font-semibold text-emerald-950/95 leading-normal select-none transition-all duration-300 rounded-xl py-1.5 px-3",
                            activeAyahAudio?.surahId === ayah.surahId && activeAyahAudio?.ayahId === ayah.ayah_id ? "bg-amber-100/70 border border-amber-200/50 shadow-[0_0_8px_4px_rgba(245,158,11,0.2)]" : ""
                          )} dir="rtl">
                            {ayah.words.map((word: any, wIdx: number) => {
                              const blurWord = mushafMode === 'blur' && !isRevealed;
                              const hintBlur = mushafMode === 'hint' && wIdx >= 2;
                              return (
                                <React.Fragment key={word.id}>
                                  <span
                                    onClick={() => handleAyahReveal(ayah.id)}
                                    className={cn(
                                      'px-1 py-0.5 rounded transition-all duration-300 select-none cursor-pointer',
                                      blurWord && 'blur-[7px]',
                                      hintBlur && 'blur-[6px]',
                                    )}
                                  >
                                    {word.text}
                                  </span>
                                  {" "}
                                </React.Fragment>
                              );
                            })}
                            {/* Ayah end marker */}
                            <span
                              className={cn(
                                'inline-flex items-center justify-center mx-2 text-emerald-600 font-sans text-xl md:text-2xl opacity-90 select-none cursor-pointer',
                                mushafMode === 'blur' && !isRevealed && 'blur-[7px]',
                              )}
                              onClick={() => handleAyahReveal(ayah.id)}
                            >
                              ۝<span className="absolute text-[10px] md:text-xs font-bold pt-1">{ayah.ayah_id}</span>
                            </span>
                          </div>
                        </React.Fragment>
                      );
                    }

                    const renderedWords = hasBismillahPrefix ? ayah.words.slice(4) : (ayah.words || []);

                    return (
                      <React.Fragment key={ayah.id}>
                        {/* Surah start banner — block element breaks flow correctly */}
                        {isFirstAyahOfSurah && (
                          <div className="w-full text-center my-6 select-none block" dir="ltr">
                            <div className="inline-block w-full max-w-lg bg-gradient-to-r from-emerald-800/10 via-emerald-850/5 to-emerald-800/10 border-y-2 border-emerald-800/20 py-3 px-6 rounded-md">
                              <h3 className="font-serif font-black text-emerald-950 text-xl md:text-2xl quran-text">
                                {mushafSurahNames[ayah.surahId]?.nameAr || 'سورة'}
                              </h3>
                              <p className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-800 mt-1">
                                Surah {mushafSurahNames[ayah.surahId]?.nameEn || ''}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Centered Bismillah Header for other Surahs */}
                        {hasBismillahPrefix && (
                          <div className="w-full text-center my-6 block font-serif font-semibold text-emerald-950/95 leading-normal select-none" dir="rtl">
                            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                          </div>
                        )}

                        {/* Each word rendered individually so text-justify works correctly */}
                        <span
                          className={cn(
                            "transition-all duration-300 px-1.5 py-0.5 rounded-lg inline",
                            activeAyahAudio?.surahId === ayah.surahId && activeAyahAudio?.ayahId === ayah.ayah_id
                              ? "bg-amber-100/80 border border-amber-250/50 shadow-[0_0_6px_rgba(245,158,11,0.25)]"
                              : ""
                          )}
                          style={{ boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}
                        >
                          {renderedWords.map((word: any, wIdx: number) => {
                            // Mode B: blur per-word within this ayah (revealed = all words shown)
                            const blurWord = mushafMode === 'blur' && !isRevealed;
                            // Mode C: blur all words except first two words
                            const hintBlur = mushafMode === 'hint' && wIdx >= 2;

                            return (
                              <React.Fragment key={word.id}>
                                <span
                                  onClick={() => handleAyahReveal(ayah.id)}
                                  title={mushafMode === 'blur' ? (isRevealed ? 'Klik untuk sembunyikan' : 'Klik untuk tampilkan') : undefined}
                                  className={cn(
                                    'px-1 py-0.5 rounded transition-all duration-300 select-none',
                                    mushafMode === 'full' && 'cursor-default',
                                    blurWord && 'blur-[7px] cursor-pointer',
                                    hintBlur && 'blur-[6px] cursor-default',
                                  )}
                                >
                                  {word.text}
                                </span>
                                {" "}
                              </React.Fragment>
                            );
                          })}

                          {/* Ayah end marker */}
                          <span
                            className={cn(
                              'inline-flex items-center justify-center mx-2 text-emerald-600 font-sans text-xl md:text-2xl opacity-90 select-none',
                              mushafMode === 'blur' && !isRevealed && 'blur-[7px] cursor-pointer',
                            )}
                            onClick={() => handleAyahReveal(ayah.id)}
                          >
                            ۝<span className="absolute text-[10px] md:text-xs font-bold pt-1">{ayah.ayah_id}</span>
                          </span>
                        </span>
                        {' '}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}

              {/* Page number footer */}
              <div className="mt-10 border-t border-emerald-800/10 pt-4 text-center select-none">
                <span className="font-serif font-black text-lg text-emerald-900/50">{mushafPage}</span>
              </div>
            </div>

            {/* RTL Page Navigation Bar at the Bottom */}
            {(() => {
              const currentPagesList = mushafSelectionMode === 'juz'
                ? getPagesForJuz(mushafSelectedJuz)
                : getPagesForSurah(mushafSelectedSurah);
              const idx = currentPagesList.indexOf(mushafPage);
              
              if (currentPagesList.length <= 1) return null;
              
              return (
                <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-100 rounded-2xl p-2.5 mt-5 select-none max-w-md mx-auto gap-4">
                  {/* Next Page Button (Left Side for RTL page navigation) */}
                  <button
                    type="button"
                    disabled={idx >= currentPagesList.length - 1}
                    onClick={() => {
                      if (idx < currentPagesList.length - 1) {
                        setMushafPage(currentPagesList[idx + 1]);
                      }
                    }}
                    className="p-2.5 bg-white hover:bg-emerald-50 disabled:opacity-30 disabled:hover:bg-white text-emerald-850 rounded-xl shadow-sm border border-emerald-150 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
                    title="Halaman Berikutnya"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Kolom Nomor Halaman (Single Clean Dropdown Selector) */}
                  <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-emerald-100/80 shadow-sm">
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wide">Halaman:</span>
                    <select
                      value={mushafPage}
                      onChange={(e) => setMushafPage(Number(e.target.value))}
                      className="bg-emerald-50/50 border border-emerald-250 rounded-lg text-xs font-black text-emerald-950 py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm cursor-pointer transition-all"
                    >
                      {currentPagesList.map((p) => (
                        <option key={p} value={p}>
                          Hal. {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Previous Page Button (Right Side for RTL page navigation) */}
                  <button
                    type="button"
                    disabled={idx <= 0}
                    onClick={() => {
                      if (idx > 0) {
                        setMushafPage(currentPagesList[idx - 1]);
                      }
                    }}
                    className="p-2.5 bg-white hover:bg-emerald-50 disabled:opacity-30 disabled:hover:bg-white text-emerald-850 rounded-xl shadow-sm border border-emerald-150 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ══ TAB 4: CATATAN KESALAHAN ════════════════════════════════════ */}
        {activeTab === 'catatan' && (
          <div className="space-y-5">

            {/* Filter bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <h2 className="font-extrabold text-gray-800 text-lg">Catatan Evaluasi Ustadz</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Daftar masukan, rincian kesalahan kata, dan catatan dari Ustadz.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyWithNotes}
                    onChange={e => setShowOnlyWithNotes(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-600"
                  />
                  <span className="text-xs font-bold text-gray-600 whitespace-nowrap">Ada catatan ustadz</span>
                </label>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs">
                  {(['all', 'jali', 'khafi', 'tark'] as ErrorFilter[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setErrorFilter(f)}
                      className={cn(
                        'px-3 py-1.5 font-bold transition-all',
                        errorFilter === f
                          ? f === 'all' ? 'bg-gray-800 text-white'
                            : f === 'jali' ? 'bg-red-600 text-white'
                            : f === 'khafi' ? 'bg-orange-500 text-white'
                            : 'bg-gray-500 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      )}
                    >
                      {f === 'all' ? 'Semua' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Kesalahan Jali', val: sessions.reduce((a, s) => a + (s.errorJaliCount || 0), 0), color: 'text-red-600', bg: 'bg-red-50' },
                { label: 'Total Kesalahan Khafi', val: sessions.reduce((a, s) => a + (s.errorKhafiCount || 0), 0), color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Total Kesalahan Tark', val: sessions.reduce((a, s) => a + (s.errorTarkCount || 0), 0), color: 'text-gray-600', bg: 'bg-gray-50' },
              ].map(card => (
                <div key={card.label} className={`${card.bg} rounded-2xl p-4 text-center`}>
                  <p className={`text-3xl font-black ${card.color}`}>{card.val}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mt-1">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Session error cards */}
            {filteredSessions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-semibold text-sm">Tidak ada catatan yang sesuai filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map(session => (
                  <div key={session.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">

                    {/* Session header */}
                    <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', session.status === 'lulus' ? 'bg-emerald-50' : 'bg-red-50')}>
                          {session.status === 'lulus'
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            : <XCircle className="w-5 h-5 text-red-500" />}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-800">
                            {session.juzId
                              ? `Juz ${session.juzId} — ${JUZ_LABELS[session.juzId] || ''}`
                              : `Surah ${session.surahId} (Ayat ${session.startAyah}–${session.endAyah})`}
                          </p>
                          <p className="text-xs text-gray-400 font-medium">
                            {new Date(session.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            {' · '}
                            {session.sessionType === 'setoran_baru' ? '📗 Setoran Baru' : '🔄 Murājaʿah'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        <div className="text-center">
                          <p className="text-2xl font-black text-gray-800">{session.scoreFinal}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Skor</p>
                        </div>
                        <div className={cn('px-3 py-1.5 rounded-full text-xs font-black', session.status === 'lulus' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                          {session.status.toUpperCase()}
                        </div>
                        <button
                          onClick={() => setSelectedLog(session)}
                          className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 transition-all"
                        >
                          Replay
                        </button>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Error type badges */}
                      <div className="flex flex-wrap gap-2">
                        {session.errorJaliCount > 0 && (
                          <span className="flex items-center space-x-1.5 bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-full text-xs font-bold">
                            <span className="w-2 h-2 bg-red-500 rounded-full" />
                            <span>Jali: {session.errorJaliCount} kesalahan fatal</span>
                          </span>
                        )}
                        {session.errorKhafiCount > 0 && (
                          <span className="flex items-center space-x-1.5 bg-orange-50 text-orange-700 border border-orange-100 px-3 py-1.5 rounded-full text-xs font-bold">
                            <span className="w-2 h-2 bg-orange-500 rounded-full" />
                            <span>Khafi: {session.errorKhafiCount} kesalahan tajwid</span>
                          </span>
                        )}
                        {session.errorTarkCount > 0 && (
                          <span className="flex items-center space-x-1.5 bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-bold">
                            <span className="w-2 h-2 bg-gray-500 rounded-full" />
                            <span>Tark: {session.errorTarkCount} ayat lupa</span>
                          </span>
                        )}
                        {session.errorJaliCount === 0 && session.errorKhafiCount === 0 && session.errorTarkCount === 0 && (
                          <span className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-full text-xs font-bold">
                            ✓ Tidak ada kesalahan tercatat
                          </span>
                        )}
                      </div>

                      {/* Error word list with Surah, Ayah and details */}
                      {session.errors && session.errors.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2.5">
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Rincian & Letak Kesalahan Kata (Klik untuk Lihat Ayat):</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {session.errors.map((err: any, ei: number) => {
                              const isSelected = selectedInlineErrorKey === `${session.id}-${ei}`;
                              return (
                                <div
                                  key={ei}
                                  onClick={() => handleInlineErrorClick(session.id, ei, err)}
                                  className={cn(
                                    "flex flex-col bg-white border p-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer",
                                    isSelected
                                      ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20"
                                      : "border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/10"
                                  )}
                                  dir="ltr"
                                  title="Klik untuk melihat teks ayat secara inline"
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center space-x-2">
                                      <span className={cn(
                                        'w-1.5 h-1.5 rounded-full flex-shrink-0',
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
                                      <span className="quran-text text-base font-bold text-emerald-950">"{err.wordTextAr || '—'}"</span>
                                    </div>
                                  </div>
                                  {err.note && (
                                    <div className="mt-1.5 pt-1.5 border-t border-gray-55 text-[10px] text-emerald-800 font-medium bg-emerald-50/50 px-2 py-1 rounded-lg">
                                      <span className="font-bold">Catatan:</span> {err.note}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Inline Ayah Reader Container */}
                          {selectedInlineErrorKey && selectedInlineErrorKey.startsWith(`${session.id}-`) && (
                            <div className="mt-3 bg-[#fbf9f4] border-2 border-emerald-800/80 rounded-2xl p-4 relative overflow-hidden transition-all animate-fadeIn shadow-sm">
                              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                              <div className="flex items-center justify-between border-b border-gray-200/60 pb-2 mb-3">
                                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider font-sans">
                                  Tampilan Teks Ayat yang Salah:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedInlineErrorKey(null);
                                    setInlineAyahData(null);
                                  }}
                                  className="text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md transition-all border border-red-200/40"
                                >
                                  Tutup
                                </button>
                              </div>

                              {inlineLoadingKey === selectedInlineErrorKey ? (
                                <div className="text-center py-4 text-xs font-semibold text-gray-400 animate-pulse font-sans">
                                  Memuat lafal ayat...
                                </div>
                              ) : inlineAyahData ? (
                                <div
                                  className="text-right quran-text leading-loose font-serif select-none"
                                  style={{ fontSize: '24px', lineHeight: 2.3 }}
                                  dir="rtl"
                                >
                                  {inlineAyahData.words.map((word: any) => {
                                    const currentErrorIndex = Number(selectedInlineErrorKey.split('-')[1]);
                                    const err = session.errors[currentErrorIndex];
                                    const isErrorWord = err && err.wordIndex === word.id;
                                    const et = isErrorWord ? err.errorType : null;

                                    return (
                                      <React.Fragment key={word.id}>
                                        <span className={cn(
                                          'px-0.5 rounded transition-all duration-150',
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
                                    ۝<span className="absolute text-[9px] font-bold pt-1">{inlineAyahData.ayah_id}</span>
                                  </span>
                                </div>
                              ) : (
                                <div className="text-center py-4 text-xs text-gray-400 italic font-sans">
                                  Gagal memuat teks ayat.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Ustadz notes */}
                      {session.notesUstadz && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start space-x-3">
                          <MessageSquare className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider mb-1.5">📝 Catatan Ustadz</p>
                            <p className="text-sm text-emerald-900 leading-relaxed">{session.notesUstadz}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB 5: RIWAYAT TASMI' ═══════════════════════════════════════ */}
        {activeTab === 'tasmi' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-emerald-50/30">
                <div>
                  <h2 className="text-xl font-black text-emerald-950 flex items-center gap-2">
                    <Mic className="w-6 h-6 text-emerald-600" /> Riwayat Tasmi' Mandiri & Teman
                  </h2>
                  <p className="text-sm text-gray-500 font-medium mt-1">
                    Daftar seluruh rekaman tasmi' mandiri dan simakan teman yang pernah Anda lakukan.
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-4 px-6">Tanggal</th>
                      <th className="py-4 px-6">Materi</th>
                      <th className="py-4 px-6">Mode</th>
                      <th className="py-4 px-6 text-center">Skor</th>
                      <th className="py-4 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                    {(() => {
                      const tasmiSessions = sessions.filter(s => s.sessionType?.startsWith('tasmi_'));
                      if (tasmiSessions.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-400">Belum ada riwayat Tasmi' ditemukan.</td>
                          </tr>
                        );
                      }
                      return tasmiSessions.map((log) => {
                        const formattedDate = new Date(log.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        });
                        return (
                          <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="py-4 px-6 text-xs text-gray-500 font-bold">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formattedDate}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-gray-800">
                              {log.juzId ? (
                                <span className="font-bold">Juz {log.juzId}</span>
                              ) : (
                                <span className="font-bold">Surah {log.surahId}</span>
                              )}
                              {log.startAyah && <span className="text-xs text-gray-400 block">Ayat {log.startAyah}-{log.endAyah}</span>}
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

        {/* ══ TAB 6: SERTIFIKAT JUZIYAH ══════════════════════════════════════ */}
        {activeTab === 'sertifikat' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-xl font-black text-emerald-950 flex items-center gap-2">
                  <Award className="w-6 h-6 text-emerald-600" /> Sertifikat Emas Juziyah Anda
                </h2>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  Barakallah! Berikut adalah daftar sertifikat kelulusan ujian juziyah Anda yang diterbitkan secara resmi oleh Koordinator.
                </p>
              </div>

              {certificates.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Award className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" />
                  <p className="text-sm font-bold">Belum ada sertifikat juziyah yang diterbitkan untuk Anda.</p>
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
          </div>
        )}

      </main>

      {/* ══ SESSION REPLAY MODAL ════════════════════════════════════════════ */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => { setSelectedLog(null); setLogQuran(null); }}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Replay Detail Sesi</h3>
                <p className="text-xs text-gray-400 font-semibold mt-1">
                  {selectedLog.juzId ? `Juz ${selectedLog.juzId}` : `Surah ${selectedLog.surahId} Ayat ${selectedLog.startAyah}–${selectedLog.endAyah}`}
                  {' · '}{new Date(selectedLog.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>
              <button onClick={() => { setSelectedLog(null); setLogQuran(null); }} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                {[
                  { label: 'Skor Akhir', val: selectedLog.scoreFinal, color: 'text-gray-800' },
                  { label: 'Jali (Fatal)', val: selectedLog.errorJaliCount, color: 'text-red-600' },
                  { label: 'Khafi (Tajwid)', val: selectedLog.errorKhafiCount, color: 'text-orange-600' },
                  { label: 'Tark (Lupa)', val: selectedLog.errorTarkCount, color: 'text-gray-500' },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">{s.label}</p>
                    <p className={`text-xl font-black ${s.color} mt-0.5`}>{s.val}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-bold text-gray-800 text-sm mb-3">Replay Teks Bacaan:</h4>
                {logQuran ? (
                  <div className="relative bg-[#fbf9f4] rounded-2xl shadow-md border-2 border-emerald-800/80 p-6 max-h-[400px] overflow-y-auto overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-36 h-36 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

                    <div
                      className="relative text-justify quran-text drop-shadow-sm leading-loose"
                      style={{ fontSize: '24px', lineHeight: 2.6 }}
                      dir="rtl"
                    >
                      {logQuran.ayahs.map((ayah: any) => {
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
                                    {mushafSurahNames[ayah.surahId]?.nameAr || 'سورة الفatحة'}
                                  </h3>
                                  <p className="text-[9px] uppercase font-extrabold tracking-widest text-emerald-800 mt-0.5">
                                    Surah {mushafSurahNames[ayah.surahId]?.nameEn || 'Al-Fatihah'}
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
                                    {mushafSurahNames[ayah.surahId]?.nameAr || 'سورة'}
                                  </h3>
                                  <p className="text-[9px] uppercase font-extrabold tracking-widest text-emerald-800 mt-0.5">
                                    Surah {mushafSurahNames[ayah.surahId]?.nameEn || ''}
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

              {/* Rincian dan Letak Kesalahan Kata List */}
              {selectedLog.errors && selectedLog.errors.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="font-bold text-gray-800 text-sm">Daftar Rincian & Letak Kesalahan Kata:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedLog.errors.map((err: any, idx: number) => (
                      <div key={idx} className="flex flex-col bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs" dir="ltr">
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
                            <span className="quran-text text-base font-bold text-emerald-950">"{err.wordTextAr || '—'}"</span>
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
                  <h4 className="font-bold text-emerald-950 text-sm mb-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1.5" /> Catatan Ustadz:
                  </h4>
                  <p className="text-emerald-900 text-sm leading-relaxed">{selectedLog.notesUstadz}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Tasmi Button */}
      <button
        onClick={() => navigate('/tasmi')}
        className="fixed bottom-20 right-6 bg-emerald-600 text-white hover:bg-emerald-700 px-5 py-4 rounded-full shadow-2xl flex items-center justify-center space-x-2 transition-transform hover:scale-105 z-50 group border-0 outline-none"
        title="Tasmi'"
      >
        <Mic className="w-6 h-6" />
        <span className="font-bold text-sm">Tasmi'</span>
      </button>

      {/* ══ SELECTED CERTIFICATE MODAL FOR VISUAL PREVIEW & PRINT ══ */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-50">Sertifikat Kelulusan Juziyah Anda</h3>
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
                      {user?.name}
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase mt-2 tracking-wide">Nomor Induk Santri (NIS): {user?.nis || '-'}</p>
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
          onClick={() => setActiveTab('home')}
          className={cn(
            "flex flex-col items-center py-1 cursor-pointer transition-colors bg-transparent border-0 outline-none",
            activeTab === 'home' ? 'text-emerald-700 font-extrabold' : 'text-gray-400'
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Beranda</span>
        </button>
        <button
          onClick={() => setActiveTab('mushaf')}
          className={cn(
            "flex flex-col items-center py-1 cursor-pointer transition-colors bg-transparent border-0 outline-none",
            activeTab === 'mushaf' ? 'text-emerald-700 font-extrabold' : 'text-gray-400'
          )}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Mushaf</span>
        </button>
        <button
          onClick={() => setActiveTab('ringkasan')}
          className={cn(
            "flex flex-col items-center py-1 cursor-pointer transition-colors bg-transparent border-0 outline-none",
            activeTab === 'ringkasan' ? 'text-emerald-700 font-extrabold' : 'text-gray-400'
          )}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Rapor</span>
        </button>
      </div>
    </div>
  );
};
