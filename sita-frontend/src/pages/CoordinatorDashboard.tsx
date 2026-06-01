// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import {
  LayoutDashboard, BookOpen, FileText, Trophy, AlertCircle, Award, LogOut,
  Users, CheckCircle2, XCircle, Clock, ChevronRight, ChevronLeft, Search, Printer,
  Sparkles, Calendar, BookMarked, MessageSquare, ArrowLeft, Send, PlayCircle, Star, X, Menu, Zap, Key
} from 'lucide-react';
import { NotificationCenter } from '../components/NotificationCenter';
import { useBranding } from '../context/BrandingContext';
import {
  useCoordinatorSummary,
  usePendingJuziyah,
  useSubmitJuziyahExam
} from '../hooks/useQueries';
import { LoadingFallback } from '../components/LoadingFallback';
import { QuranReader } from '../components/QuranReader';

// JUZ Labels
const JUZ_LABELS: Record<number, string> = {
  1: 'Al-Fatihah & Al-Baqarah (Juz 1)', 2: 'Sayaqul (Juz 2)', 3: 'Tilkar Rusul (Juz 3)',
  4: 'Lan Tanalu (Juz 4)', 5: 'Wal Muhshanat (Juz 5)', 6: 'La Yuhibbullahu (Juz 6)',
  7: 'Wa Iza Sami\'u (Juz 7)', 8: 'Walau Annana (Juz 8)', 9: 'Qalal Mala\'u (Juz 9)',
  10: 'Wa\'lamu (Juz 10)', 11: 'Ya\'tazirun (Juz 11)', 12: 'Wa Ma Min Dabbatin (Juz 12)',
  13: 'Wa Ma Ubarri\'u (Juz 13)', 14: 'Rubama (Juz 14)', 15: 'Subhanallazi (Juz 15)',
  16: 'Qala Alam (Juz 16)', 17: 'Iqtaraba (Juz 17)', 18: 'Qad Aflaha (Juz 18)',
  19: 'Wa Qalal Lazina (Juz 19)', 20: 'Amman Khalaqa (Juz 20)', 21: 'Utlu Ma Uhiya (Juz 21)',
  22: 'Wa Man Yaqnut (Juz 22)', 23: 'Wa Maliya (Juz 23)', 24: 'Faman Azlamu (Juz 24)',
  25: 'Ilaihi Yuraddu (Juz 25)', 26: 'Ha Mim (Juz 26)', 27: 'Qala Fama Khatbukum (Juz 27)',
  28: 'Qad Sami\'allahu (Juz 28)', 29: 'Tabarakallazi (Juz 29)', 30: 'Amma Yatasa\'alun (Juz 30)',
};

const getJuzPageRange = (juz: number) => {
  if (juz === 1) return { start: 1, end: 21 };
  if (juz === 30) return { start: 582, end: 604 };
  
  const start = 22 + (juz - 2) * 20;
  const end = start + 19;
  return { start, end };
};

export const CoordinatorDashboard = () => {
  const navigate = useNavigate();
  const { appName, appLogo, footerText } = useBranding();
  const user = api.getUser();

  const [activeTab, setActiveTab] = useState<'overview' | 'halaqah' | 'rekap_laporan' | 'rekap_pencapaian' | 'pending_ujian' | 'sertifikat' | 'password'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active Juziyah Workstation State
  const [activeExam, setActiveExam] = useState<any>(null);
  const [examErrors, setExamErrors] = useState({ jali: 0, khafi: 0, tark: 0 });
  const [examNotes, setExamNotes] = useState('');
  const [sessionErrors, setSessionErrors] = useState<any[]>([]);
  const [submittingExam, setSubmittingExam] = useState(false);
  const [isQuickLogMode, setIsQuickLogMode] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHalaqahFilter, setSelectedHalaqahFilter] = useState('');
  const [selectedSessionTypeFilter, setSelectedSessionTypeFilter] = useState('');

  // Selected Certificate for Visual Preview Modal
  const [selectedCert, setSelectedCert] = useState<any>(null);

  // ═══ TanStack Query — data fetching with caching ═══
  const { data: summary, isLoading: isLoadingSummary, error: summaryError } = useCoordinatorSummary();
  const { data: pendingExams = [], isLoading: isLoadingExams, error: examsError } = usePendingJuziyah();
  const submitJuziyahMutation = useSubmitJuziyahExam();

  const loading = isLoadingSummary || isLoadingExams;
  const error = summaryError ? (summaryError as Error).message : examsError ? (examsError as Error).message : null;

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  // Auto-calculated score based on ustadz configuration
  const calculatedScore = useMemo(() => {
    const initial = 100;
    const penaltyJali = 3;
    const penaltyKhafi = 1;
    const penaltyTark = 2;
    const computed = initial - (examErrors.jali * penaltyJali) - (examErrors.khafi * penaltyKhafi) - (examErrors.tark * penaltyTark);
    return Math.max(0, computed);
  }, [examErrors]);

  const examStatusResult = useMemo(() => {
    return calculatedScore >= 80 ? 'lulus' : 'mengulang';
  }, [calculatedScore]);

  const handleStartExam = (exam: any) => {
    setActiveExam(exam);
    setExamErrors({ jali: 0, khafi: 0, tark: 0 });
    setExamNotes('');
    setSessionErrors([]);
    setIsQuickLogMode(false);
  };

  const handleCancelExam = () => {
    setActiveExam(null);
    setSessionErrors([]);
    setIsQuickLogMode(false);
  };

  const handleErrorsChange = (errs: any[]) => {
    setSessionErrors(errs);
    
    // Dynamically calculate counts of jali, khafi, tark errors from the interactive mushaf!
    const jaliCount = errs.filter(e => e.type === 'jali').length;
    const khafiCount = errs.filter(e => e.type === 'khafi').length;
    const tarkCount = errs.filter(e => e.type === 'tark').length;
    
    setExamErrors({ jali: jaliCount, khafi: khafiCount, tark: tarkCount });
  };
 
  const handleSubmitExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExam) return;
 
    try {
      setSubmittingExam(true);
      
      // Automatically generate a beautifully formatted, highly readable text recap of the specific word errors
      let enrichedNotes = examNotes;
      if (sessionErrors.length > 0) {
        enrichedNotes += (enrichedNotes ? "\n\n" : "") + "=== Rincian Kesalahan Mushaf (Interaktif) ===\n";
        sessionErrors.forEach((err, idx) => {
          const firstWord = err.words && err.words[0];
          const locationText = firstWord 
            ? `Surah ID ${firstWord.surahId} Ayat ${firstWord.ayahId}, Kata: "${err.words.map(w => w.text).join(' ')}"` 
            : 'Lokasi tidak diketahui';
          enrichedNotes += `${idx + 1}. ${locationText}: Salah ${err.type.toUpperCase()} (${err.note ? `Catatan: ${err.note}` : 'Tidak ada catatan'})\n`;
        });
      }

      const res = await submitJuziyahMutation.mutateAsync({
        examId: activeExam.id,
        score: calculatedScore,
        status: examStatusResult,
        notes: enrichedNotes
      });

      // Clear workstation, reload data
      setActiveExam(null);
      // TanStack Query mutation automatically invalidates the cache

      // If passed, open certificate preview
      if (examStatusResult === 'lulus' && res.certificate) {
        // Enriched certificate object for instant view
        const certEnriched = {
          ...res.certificate,
          exam: {
            ...activeExam,
            score: calculatedScore
          }
        };
        setSelectedCert(certEnriched);
      } else {
        alert(`Ujian Juziyah selesai dinilai. Santri dinyatakan: ${examStatusResult.toUpperCase()}`);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim nilai ujian');
    } finally {
      setSubmittingExam(false);
    }
  };

  // Filtered Rekap Laporan Sessions
  const filteredSessions = useMemo(() => {
    if (!summary || !summary.rekapLaporan) return [];
    return summary.rekapLaporan.filter((s: any) => {
      const matchSearch = s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.student.nis && s.student.nis.includes(searchQuery));
      const matchHalaqah = selectedHalaqahFilter ? s.halaqahId === Number(selectedHalaqahFilter) : true;
      const matchType = selectedSessionTypeFilter ? s.sessionType === selectedSessionTypeFilter : true;
      return matchSearch && matchHalaqah && matchType;
    });
  }, [summary, searchQuery, selectedHalaqahFilter, selectedSessionTypeFilter]);

  // Filtered Rekap Pencapaian Students
  const filteredPencapaian = useMemo(() => {
    if (!summary || !summary.rekapPencapaian) return [];
    return summary.rekapPencapaian.filter((p: any) => {
      return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.nis && p.nis.includes(searchQuery));
    });
  }, [summary, searchQuery]);

  // Filtered Certificates
  const filteredCertificates = useMemo(() => {
    if (!summary || !summary.rekapPencapaian) return [];
    // Extract all certificates from rekapPencapaian
    const allCerts: any[] = [];
    summary.rekapPencapaian.forEach((p: any) => {
      if (p.certifiedJuzs) {
        p.certifiedJuzs.forEach((cj: any) => {
          allCerts.push({
            id: cj.certificateNo,
            certificateNo: cj.certificateNo,
            issuedAt: cj.issuedAt,
            exam: {
              juzId: cj.juzId,
              score: cj.score,
              student: {
                id: p.id,
                name: p.name,
                nis: p.nis,
                level: { name: p.levelName }
              }
            }
          });
        });
      }
    });

    // sort desc by issuedAt
    allCerts.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

    return allCerts.filter((c: any) => {
      return c.exam.student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             (c.exam.student.nis && c.exam.student.nis.includes(searchQuery));
    });
  }, [summary, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      
      {/* ── STYLE INJECTION FOR PRINTING PREMIUM CERTIFICATE ── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: none !important;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 297mm; /* A4 Landscape width */
            height: 210mm; /* A4 Landscape height */
            margin: 0;
            padding: 10mm;
            box-sizing: border-box;
            background: #ffffff !important;
            color: #1e293b !important;
            page-break-after: avoid;
            page-break-inside: avoid;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Hide standard headers and scrollbars */
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>

      {/* Mobile Drawer Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 shadow-sm flex items-center justify-between px-4 h-16 md:hidden w-full shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-900 rounded-xl transition-all"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          {appLogo ? (
            <img src={appLogo} alt={appName} className="h-8 w-auto object-contain rounded-lg" />
          ) : (
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black">
              {appName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-bold text-slate-50 text-sm leading-tight">{appName}</h1>
            <p className="text-[9px] text-indigo-400 font-semibold uppercase tracking-wider">Koordinator</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <NotificationCenter />
        </div>
      </header>

      {/* Backdrop for mobile drawer */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
        ></div>
      )}

      {/* ── Left Sidebar (Responsive Drawer on Mobile) ── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 bg-slate-950 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out transform md:translate-x-0 md:static md:h-screen md:flex-shrink-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        isSidebarCollapsed ? "md:w-20" : "md:w-72 w-72"
      )}>
        <div>
          {/* Institution Identity */}
          <div className="p-6 border-b border-slate-800/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="w-10 h-10 object-contain rounded-md shrink-0" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-lg flex items-center justify-center font-bold text-lg text-white shadow-md shadow-indigo-600/30 shrink-0">
                  S
                </div>
              )}
              {!isSidebarCollapsed && (
                <div className="animate-fadeIn truncate">
                  <h1 className="font-bold text-lg tracking-wide text-slate-50">{appName || 'SITA Tahfidz'}</h1>
                  <p className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">Koordinator SITA</p>
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex items-center justify-center bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 p-1.5 rounded-xl transition-all cursor-pointer"
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => { setActiveTab('overview'); handleCancelExam(); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isSidebarCollapsed ? "justify-center" : "justify-start",
                activeTab === 'overview'
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              )}
              title={isSidebarCollapsed ? "Dasbor Ringkasan" : undefined}
            >
              <LayoutDashboard className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="animate-fadeIn">Dasbor Ringkasan</span>}
            </button>

            <button
              onClick={() => { setActiveTab('halaqah'); handleCancelExam(); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isSidebarCollapsed ? "justify-center" : "justify-start",
                activeTab === 'halaqah'
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              )}
              title={isSidebarCollapsed ? "Monitor Halaqah" : undefined}
            >
              <BookOpen className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="animate-fadeIn">Monitor Halaqah</span>}
            </button>

            <button
              onClick={() => { setActiveTab('rekap_laporan'); handleCancelExam(); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isSidebarCollapsed ? "justify-center" : "justify-start",
                activeTab === 'rekap_laporan'
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              )}
              title={isSidebarCollapsed ? "Rekap Laporan" : undefined}
            >
              <FileText className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="animate-fadeIn">Rekap Laporan</span>}
            </button>

            <button
              onClick={() => { setActiveTab('rekap_pencapaian'); handleCancelExam(); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isSidebarCollapsed ? "justify-center" : "justify-start",
                activeTab === 'rekap_pencapaian'
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              )}
              title={isSidebarCollapsed ? "Rekap Pencapaian Target" : undefined}
            >
              <Trophy className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="animate-fadeIn">Rekap Pencapaian Target</span>}
            </button>

            <button
              onClick={() => { setActiveTab('pending_ujian'); handleCancelExam(); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative",
                isSidebarCollapsed ? "justify-center" : "justify-start",
                activeTab === 'pending_ujian' || activeExam
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              )}
              title={isSidebarCollapsed ? "Pengajuan Ujian Juziyah" : undefined}
            >
              <span className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4" />
                {!isSidebarCollapsed && <span className="animate-fadeIn">Pengajuan Ujian Juziyah</span>}
              </span>
              {pendingExams.length > 0 && (
                <span className={cn(
                  "bg-rose-500 text-white text-xs font-bold py-0.5 rounded-full animate-pulse",
                  isSidebarCollapsed ? "absolute -top-1 -right-1 px-1.5 text-[8px]" : "px-2"
                )}>
                  {pendingExams.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('sertifikat'); handleCancelExam(); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isSidebarCollapsed ? "justify-center" : "justify-start",
                activeTab === 'sertifikat'
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              )}
              title={isSidebarCollapsed ? "Sertifikat Juziyah" : undefined}
            >
              <Award className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="animate-fadeIn">Sertifikat Juziyah</span>}
            </button>

            <button
              onClick={() => { setActiveTab('password'); handleCancelExam(); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isSidebarCollapsed ? "justify-center" : "justify-start",
                activeTab === 'password'
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              )}
              title={isSidebarCollapsed ? "Ubah Password" : undefined}
            >
              <Key className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="animate-fadeIn">Ubah Password</span>}
            </button>
          </nav>
        </div>

        {/* User Identity Panel */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          <div className={cn(
            "flex items-center gap-3 mb-3",
            isSidebarCollapsed ? "justify-center" : "justify-start"
          )}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 shrink-0">
                {user?.name ? user.name[0] : 'K'}
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0 animate-fadeIn truncate">
                  <h4 className="font-semibold text-sm text-slate-200 truncate">{user?.name || 'Sarah'}</h4>
                  <p className="text-xs text-slate-400 truncate">{user?.email || 'koordinator@sita.id'}</p>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer",
              isSidebarCollapsed ? "w-10 h-10 px-0 mx-auto" : "w-full px-4"
            )}
            title={isSidebarCollapsed ? "Keluar Sistem" : undefined}
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            {!isSidebarCollapsed && <span className="animate-fadeIn">Keluar Sistem</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        {loading ? (
          <div className="h-[70vh] flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm">Sedang memuat data...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-950/30 border border-rose-500/30 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 max-w-lg mx-auto mt-10">
            <XCircle className="w-12 h-12 text-rose-400" />
            <h3 className="font-semibold text-lg text-rose-300">Gagal Mengambil Data</h3>
            <p className="text-sm text-slate-400 text-center">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-6 rounded-xl text-sm mt-3 shadow-md"
            >
              Coba Lagi
            </button>
          </div>
        ) : activeExam ? (
          /* Workstation Ujian Juziyah */
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header Workstation */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleCancelExam}
                  className="bg-slate-900 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full">
                      Exam Workstation
                    </span>
                    <span className="bg-amber-900/60 border border-amber-500/30 text-amber-300 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full">
                      Juz {activeExam.juzId}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-50 mt-1">Ujian Juziyah: {activeExam.student.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Diajukan oleh: Ustadz {activeExam.ustadz.name} &bull; NIS: {activeExam.student.nis || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap w-full sm:w-auto justify-end">
                {/* Mode Selector Toggle Switch */}
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsQuickLogMode(false)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-[10px] font-extrabold transition-all uppercase tracking-wider cursor-pointer",
                      !isQuickLogMode
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/40"
                    )}
                  >
                    Mode Mushaf
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsQuickLogMode(true)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-[10px] font-extrabold transition-all uppercase tracking-wider cursor-pointer",
                      isQuickLogMode
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/40"
                    )}
                  >
                    Mode Cepat
                  </button>
                </div>

                {/* Live Calculator Score */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wide">Live Score</p>
                    <p className="text-3xl font-extrabold tracking-tight text-white">{calculatedScore}</p>
                  </div>
                  <div className="h-10 w-[1px] bg-slate-800"></div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wide">Status Kelulusan</p>
                    <span className={cn(
                      "inline-block text-xs font-extrabold px-3 py-1 rounded-full uppercase mt-1 border tracking-wide",
                      examStatusResult === 'lulus'
                        ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-400"
                        : "bg-rose-950/60 border-rose-500/30 text-rose-400"
                    )}>
                      {examStatusResult === 'lulus' ? 'Lulus (>=80)' : 'Mengulang (<80)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Assessment Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quran Info / Standard Guidance */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    Panduan & Deskripsi Kesalahan
                  </h3>
                  
                  <div className="space-y-3.5 text-sm text-slate-300">
                    <p className="text-slate-400 leading-relaxed text-xs">
                      Evaluasi ujian juziyah mengacu pada standar penilaian talaqqi SITA. Masukkan frekuensi kesalahan yang terjadi selama ujian juz berlangsung di kolom sebelah kanan.
                    </p>

                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded bg-rose-950 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center shrink-0">-3</span>
                        <div>
                          <h4 className="font-bold text-slate-200 text-xs">Salah Jali (Fatal)</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Kesalahan yang merubah lafadz & merusak makna (misal: salah harakat, salah huruf, tertukar makhraj fatal, menambah/mengurangi huruf).</p>
                        </div>
                      </div>

                      <div className="h-[1px] bg-slate-800/60"></div>

                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded bg-amber-950 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">-1</span>
                        <div>
                          <h4 className="font-bold text-slate-200 text-xs">Salah Khafi (Ringan)</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Kesalahan tajwid ringan yang tidak mengubah makna (misal: panjang pendek kurang konsisten, dengung kurang sempurna, sifatul huruf).</p>
                        </div>
                      </div>

                      <div className="h-[1px] bg-slate-800/60"></div>

                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded bg-amber-950 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center shrink-0">-2</span>
                        <div>
                          <h4 className="font-bold text-slate-200 text-xs">Salah Tark (Tersendat/Lupa)</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Kesalahan kelancaran karena ragu-ragu, terhenti lebih dari 3 detik, lupa sambungan ayat, atau dibantu dibacakan potongan lanjutannya.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {!isQuickLogMode && (
                  /* Interactive Mushaf Reader */
                  <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 animate-fadeIn">
                    <h3 className="font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                      <BookMarked className="w-5 h-5 text-indigo-400" />
                      Mushaf Ujian Juziyah Interaktif (Juz {activeExam.juzId})
                    </h3>
                    <div className="space-y-4 text-slate-900">
                      <QuranReader
                        key={`exam-${activeExam.id}-${activeExam.juzId}`}
                        selectionMode="juz"
                        surahId={1}
                        startAyah={1}
                        endAyah={1}
                        startPage={getJuzPageRange(activeExam.juzId).start}
                        endPage={getJuzPageRange(activeExam.juzId).end}
                        onScoreChange={() => {}} // calculatedScore is automatically computed from setExamErrors in handleErrorsChange
                        onErrorsChange={handleErrorsChange}
                        scoreInitial={100}
                        penaltyJali={3}
                        penaltyKhafi={1}
                        penaltyTark={2}
                        studentHeatmap={[]}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Assessment Form Box */}
              <div className="lg:col-span-1">
                <form onSubmit={handleSubmitExam} className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-5">
                  <h3 className="font-bold text-slate-100 border-b border-slate-800 pb-3">Form Penilaian Ujian</h3>

                  {/* Errors Counter Inputs - ONLY shown in Quick-Log (Mode Cepat) */}
                  {isQuickLogMode && (
                    <div className="space-y-4 animate-fadeIn">
                      <div>
                        <label className="text-xs text-slate-400 font-bold uppercase block mb-1">Salah Jali (x3)</label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setExamErrors(prev => ({ ...prev, jali: Math.max(0, prev.jali - 1) }))}
                            className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-l-xl hover:bg-slate-800 font-bold text-slate-100 cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={examErrors.jali}
                            onChange={(e) => setExamErrors(prev => ({ ...prev, jali: Math.max(0, parseInt(e.target.value) || 0) }))}
                            className="w-full bg-slate-900 border-y border-slate-800 py-2 text-center font-bold text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => setExamErrors(prev => ({ ...prev, jali: prev.jali + 1 }))}
                            className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-r-xl hover:bg-slate-800 font-bold text-slate-100 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 font-bold uppercase block mb-1">Salah Khafi (x1)</label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setExamErrors(prev => ({ ...prev, khafi: Math.max(0, prev.khafi - 1) }))}
                            className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-l-xl hover:bg-slate-800 font-bold text-slate-100 cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={examErrors.khafi}
                            onChange={(e) => setExamErrors(prev => ({ ...prev, khafi: Math.max(0, parseInt(e.target.value) || 0) }))}
                            className="w-full bg-slate-900 border-y border-slate-800 py-2 text-center font-bold text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => setExamErrors(prev => ({ ...prev, khafi: prev.khafi + 1 }))}
                            className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-r-xl hover:bg-slate-800 font-bold text-slate-100 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 font-bold uppercase block mb-1">Salah Tark (x2)</label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setExamErrors(prev => ({ ...prev, tark: Math.max(0, prev.tark - 1) }))}
                            className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-l-xl hover:bg-slate-800 font-bold text-slate-100 cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={examErrors.tark}
                            onChange={(e) => setExamErrors(prev => ({ ...prev, tark: Math.max(0, parseInt(e.target.value) || 0) }))}
                            className="w-full bg-slate-900 border-y border-slate-800 py-2 text-center font-bold text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => setExamErrors(prev => ({ ...prev, tark: prev.tark + 1 }))}
                            className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-r-xl hover:bg-slate-800 font-bold text-slate-100 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes Field */}
                  <div>
                    <label className="text-xs text-slate-400 font-bold uppercase block mb-1">Catatan Ujian & Evaluasi</label>
                    <textarea
                      value={examNotes}
                      onChange={(e) => setExamNotes(e.target.value)}
                      placeholder="Masukkan evaluasi tajwid, kelancaran, catatan kelulusan santri..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 h-32"
                    ></textarea>
                  </div>

                  {/* Submitting Actions */}
                  <button
                    type="submit"
                    disabled={submittingExam}
                    className={cn(
                      "w-full py-3.5 px-6 rounded-2xl font-bold transition-all duration-200 border flex items-center justify-center gap-2",
                      examStatusResult === 'lulus'
                        ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-500/20 text-white shadow-lg shadow-emerald-600/10"
                        : "bg-amber-600 hover:bg-amber-500 border-amber-500/20 text-white shadow-lg shadow-amber-600/10"
                    )}
                  >
                    {submittingExam ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Menyimpan Hasil...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        {examStatusResult === 'lulus' ? 'Lulus & Terbitkan Sertifikat' : 'Simpan & Ulangi Ujian'}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelExam}
                    className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 py-3 rounded-2xl text-slate-400 font-semibold transition-colors"
                  >
                    Batal
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* Standard Coordinator Tabs Dashboard */
          <div className="space-y-8">
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-50">
                  {activeTab === 'overview' && 'Dasbor Koordinator Akademik'}
                  {activeTab === 'halaqah' && 'Monitoring Kelompok Halaqah'}
                  {activeTab === 'rekap_laporan' && 'Rekapitulasi Aktivitas Setoran & Muraja\'ah'}
                  {activeTab === 'rekap_pencapaian' && 'Rekapitulasi Kelulusan & Pencapaian'}
                  {activeTab === 'pending_ujian' && 'Antrean Pengajuan Ujian Juziyah'}
                  {activeTab === 'sertifikat' && 'Galeri Penerbitan Sertifikat Kelulusan'}
                  {activeTab === 'password' && 'Ubah Password Mandiri'}
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">
                  {activeTab === 'overview' && 'Ringkasan monitor seluruh aktivitas kelompok tahfidz & pengajuan ujian.'}
                  {activeTab === 'halaqah' && 'Memantau keaktifan santri, musyrif, dan detail data kelompok halaqah.'}
                  {activeTab === 'rekap_laporan' && 'Laporan log mutaba\'ah setoran baru dan muraja\'ah seluruh halaqah.'}
                  {activeTab === 'rekap_pencapaian' && 'Ringkasan tingkat kelulusan, juz tuntas, dan skor rata-rata santri.'}
                  {activeTab === 'pending_ujian' && 'Daftar antrean ujian hafalan juziyah yang diajukan oleh para ustadz.'}
                  {activeTab === 'sertifikat' && 'Daftar sertifikat kelulusan formal berornamen emas digital yang telah diterbitkan.'}
                  {activeTab === 'password' && 'Ubah password login Anda saat ini secara mandiri.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:block">
                  <NotificationCenter />
                </div>
                <div className="bg-slate-950 px-4 py-2 border border-slate-800 rounded-2xl text-xs font-semibold text-slate-400 flex items-center gap-2 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Hari Ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Overview / Widgets tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                  <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-3xl flex items-center gap-4">
                    <div className="p-3.5 bg-indigo-950 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Halaqah</p>
                      <p className="text-2xl font-bold text-slate-50 mt-0.5">{summary?.totalHalaqahs || 0}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-3xl flex items-center gap-4">
                    <div className="p-3.5 bg-indigo-950 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                      <Users className="w-6 h-6 text-indigo-300" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Musyrif</p>
                      <p className="text-2xl font-bold text-slate-50 mt-0.5">{summary?.totalMusyrifs || 0}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-3xl flex items-center gap-4">
                    <div className="p-3.5 bg-indigo-950 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                      <Users className="w-6 h-6 text-indigo-200" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Santri</p>
                      <p className="text-2xl font-bold text-slate-50 mt-0.5">{summary?.totalStudents || 0}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-3xl flex items-center gap-4">
                    <div className="p-3.5 bg-indigo-950 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sertifikat Terbit</p>
                      <p className="text-2xl font-bold text-slate-50 mt-0.5">{summary?.totalCertificates || 0}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-3xl flex items-center gap-4">
                    <div className="p-3.5 bg-indigo-950 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                      <Star className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rasio Kelulusan</p>
                      <p className="text-2xl font-bold text-slate-50 mt-0.5">{summary?.examPassRatio || 0}%</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Halaqah Monitor Card */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                        <h3 className="font-bold text-slate-100 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-indigo-400" />
                          Ringkasan Kelompok Halaqah
                        </h3>
                        <button
                          onClick={() => setActiveTab('halaqah')}
                          className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1"
                        >
                          Selengkapnya <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="divide-y divide-slate-800/60 space-y-3">
                        {summary?.halaqahs && summary.halaqahs.map((h: any) => (
                          <div key={h.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                            <div>
                              <h4 className="font-bold text-sm text-slate-200">{h.name}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">Ustadz pengampu: <span className="text-indigo-300 font-semibold">{h.ustadz.name}</span></p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl text-center">
                              <p className="text-sm font-extrabold text-slate-200">{h.studentCount}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Santri</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Pending Exams Checklist Card */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                        <h3 className="font-bold text-slate-100 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-rose-400 animate-pulse" />
                          Antrean Ujian Pending
                        </h3>
                        <span className="bg-rose-950 border border-rose-500/30 text-rose-400 text-xs font-bold px-2 py-0.5 rounded-full">
                          {pendingExams.length}
                        </span>
                      </div>

                      {pendingExams.length === 0 ? (
                        <div className="py-8 text-center space-y-2">
                          <CheckCircle2 className="w-10 h-10 text-emerald-400/30 mx-auto" />
                          <p className="text-xs text-slate-400 font-medium">Semua antrean ujian telah dinilai.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {pendingExams.slice(0, 3).map((pe: any) => (
                            <div key={pe.id} className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl space-y-3">
                              <div className="flex justify-between items-start gap-3">
                                <div>
                                  <h4 className="font-bold text-sm text-slate-200">{pe.student.name}</h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Ustadz: {pe.ustadz.name}</p>
                                </div>
                                <span className="bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  Juz {pe.juzId}
                                </span>
                              </div>
                              <button
                                onClick={() => handleStartExam(pe)}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs transition-colors tracking-wide uppercase"
                              >
                                Mulai Pengujian
                              </button>
                            </div>
                          ))}

                          {pendingExams.length > 3 && (
                            <button
                              onClick={() => setActiveTab('pending_ujian')}
                              className="w-full text-center text-xs font-bold text-indigo-400 hover:text-indigo-300 pt-2 block"
                            >
                              Lihat {pendingExams.length - 3} pengajuan lainnya &rarr;
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Halaqah Tab */}
            {activeTab === 'halaqah' && (
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6">
                <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="font-bold text-slate-100 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    Daftar dan Visualisasi Halaqah
                  </h3>
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      placeholder="Cari Ustadz atau Halaqah..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {summary?.halaqahs && summary.halaqahs
                    .filter((h: any) => h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.ustadz.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((h: any) => (
                      <div key={h.id} className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-4 hover:border-slate-700/60 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h4 className="font-extrabold text-slate-100 text-base">{h.name}</h4>
                            <p className="text-xs text-slate-400 mt-1">{h.description || 'Kelompok tahfidz reguler'}</p>
                          </div>
                          <span className="bg-indigo-950 border border-indigo-500/20 text-indigo-400 text-xs font-bold px-3 py-1 rounded-xl">
                            {h.studentCount} Santri
                          </span>
                        </div>

                        <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/40 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300">
                            {h.ustadz.name[0]}
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Musyrif Halaqah</p>
                            <p className="text-xs font-bold text-slate-200 mt-0.5">{h.ustadz.name}</p>
                          </div>
                        </div>

                        {/* Student list dropdown-like visual */}
                        <div className="space-y-1.5 pt-2">
                          <p className="text-[10px] uppercase font-bold tracking-wide text-slate-500 block mb-1">Daftar Santri</p>
                          {h.students && h.students.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {h.students.map((s: any) => (
                                <span key={s.id} className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-xl">
                                  {s.name} <span className="text-[10px] text-indigo-400">({s.level?.name || 'Lvl 1'})</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic">Belum ada santri terdaftar di halaqah ini.</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Rekap Laporan Tab */}
            {activeTab === 'rekap_laporan' && (
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6">
                {/* Search & Filter bar */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div className="relative w-full xl:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      placeholder="Cari nama santri..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Kelompok Halaqah</label>
                      <select
                        value={selectedHalaqahFilter}
                        onChange={(e) => setSelectedHalaqahFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-200 text-sm px-4 py-2.5 rounded-2xl focus:outline-none"
                      >
                        <option value="">Semua Halaqah</option>
                        {summary?.halaqahs && summary.halaqahs.map((h: any) => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Kategori Aktivitas</label>
                      <select
                        value={selectedSessionTypeFilter}
                        onChange={(e) => setSelectedSessionTypeFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-200 text-sm px-4 py-2.5 rounded-2xl focus:outline-none"
                      >
                        <option value="">Semua Jenis</option>
                        <option value="setoran_baru">Setoran Baru</option>
                        <option value="murajaah">Muraja'ah</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                        <th className="py-4 px-6">Santri</th>
                        <th className="py-4 px-6">Halaqah</th>
                        <th className="py-4 px-6">Aktivitas</th>
                        <th className="py-4 px-6 text-center">Juz</th>
                        <th className="py-4 px-6 text-center">Skor Akhir</th>
                        <th className="py-4 px-6 text-center">Status</th>
                        <th className="py-4 px-6">Ustadz</th>
                        <th className="py-4 px-6">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {filteredSessions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500 italic">
                            Tidak ditemukan data laporan mutaba'ah yang cocok.
                          </td>
                        </tr>
                      ) : (
                        filteredSessions.map((s: any) => (
                          <tr key={s.id} className="hover:bg-slate-900/35 transition-colors">
                            <td className="py-4 px-6">
                              <p className="font-bold text-slate-200">{s.student.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">NIS: {s.student.nis || '-'}</p>
                            </td>
                            <td className="py-4 px-6 text-slate-300 font-medium">{s.halaqah.name}</td>
                            <td className="py-4 px-6">
                              <span className={cn(
                                "inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border",
                                s.sessionType === 'setoran_baru'
                                  ? "bg-teal-950/60 border-teal-500/20 text-teal-400"
                                  : "bg-indigo-950/60 border-indigo-500/20 text-indigo-400"
                              )}>
                                {s.sessionType === 'setoran_baru' ? 'Setoran' : 'Muraja\'ah'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center text-slate-300 font-bold">{s.juzId || '-'}</td>
                            <td className="py-4 px-6 text-center text-white font-extrabold">{s.scoreFinal}</td>
                            <td className="py-4 px-6 text-center">
                              <span className={cn(
                                "inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded border",
                                s.status === 'lulus'
                                  ? "bg-emerald-950/50 border-emerald-500/20 text-emerald-400"
                                  : "bg-rose-950/50 border-rose-500/20 text-rose-400"
                              )}>
                                {s.status === 'lulus' ? 'Lulus' : 'Mengulang'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-400 text-xs font-medium">{s.ustadz.name}</td>
                            <td className="py-4 px-6 text-slate-400 text-xs">
                              {new Date(s.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Rekap Pencapaian Tab */}
            {activeTab === 'rekap_pencapaian' && (
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6">
                <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="font-bold text-slate-100 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-indigo-400" />
                    Rekapitulasi Target & Kelulusan Juziyah
                  </h3>
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      placeholder="Cari nama santri..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                        <th className="py-4 px-6">Nama Santri</th>
                        <th className="py-4 px-6">Jenjang Hafalan</th>
                        <th className="py-4 px-6 text-center">Rata-rata Nilai</th>
                        <th className="py-4 px-6 text-center">Setoran / Muraja'ah</th>
                        <th className="py-4 px-6">Kelulusan Juziyah (Sertifikat)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {filteredPencapaian.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                            Tidak ditemukan pencapaian santri.
                          </td>
                        </tr>
                      ) : (
                        filteredPencapaian.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-900/35 transition-colors">
                            <td className="py-4 px-6">
                              <p className="font-bold text-slate-200">{p.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">NIS: {p.nis || '-'}</p>
                            </td>
                            <td className="py-4 px-6">
                              <span className="bg-indigo-950 border border-indigo-500/20 text-indigo-400 font-bold text-xs px-2.5 py-1 rounded-xl">
                                {p.levelName}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center text-emerald-400 font-extrabold">{p.stats.averageScore}</td>
                            <td className="py-4 px-6 text-center text-slate-300 font-medium">
                              {p.stats.setoranCount}x Setor &bull; {p.stats.murajaahCount}x Muraja'ah
                            </td>
                            <td className="py-4 px-6">
                              {p.certifiedJuzs && p.certifiedJuzs.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {p.certifiedJuzs.map((cj: any) => (
                                    <span key={cj.juzId} className="bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                      Juz {cj.juzId} Lulus ({cj.score})
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500 italic">Belum lulus ujian Juziyah</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pending Ujian Tab */}
            {activeTab === 'pending_ujian' && (
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6">
                <h3 className="font-bold text-slate-100 border-b border-slate-800 pb-4">
                  Daftar Antrean Pengajuan Ujian Juziyah
                </h3>

                {pendingExams.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <CheckCircle2 className="w-14 h-14 text-emerald-400/20 mx-auto" />
                    <h4 className="font-bold text-slate-300">Antrean Kosong</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">Barakallah, seluruh pengajuan ujian juziyah dari ustadzah halaqah telah diselesaikan dan dinilai.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingExams.map((pe: any) => (
                      <div key={pe.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between gap-5 hover:border-slate-700/60 transition-colors">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="font-extrabold text-slate-100 text-sm">{pe.student.name}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">NIS: {pe.student.nis || '-'}</p>
                            </div>
                            <span className="bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
                              Juz {pe.juzId}
                            </span>
                          </div>

                          <div className="h-[1px] bg-slate-800/60"></div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/30">
                              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wide">Ustadzah Pengaju</p>
                              <p className="font-semibold text-slate-200 mt-0.5 truncate">{pe.ustadz.name}</p>
                            </div>

                            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/30">
                              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wide">Diajukan Pada</p>
                              <p className="font-semibold text-slate-200 mt-0.5">
                                {new Date(pe.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartExam(pe)}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 uppercase tracking-wider"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Mulai Pengujian Ujian
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sertifikat Gallery Tab */}
            {activeTab === 'sertifikat' && (
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6">
                <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="font-bold text-slate-100 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-400" />
                    Sertifikat Kelulusan Juziyah yang Diterbitkan
                  </h3>
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      placeholder="Cari santri penerima..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                  </div>
                </div>

                {filteredCertificates.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 italic">
                    Belum ada sertifikat juziyah yang telah diterbitkan atau tidak ditemukan.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCertificates.map((cert: any) => (
                      <div key={cert.id} className="bg-gradient-to-tr from-slate-950 to-slate-900 border border-[#d4af37]/20 p-5 rounded-3xl hover:border-[#d4af37]/40 transition-all flex flex-col justify-between gap-5 relative group overflow-hidden">
                        
                        {/* Golden corner visual ornament */}
                        <div className="absolute -top-6 -right-6 w-12 h-12 border-b border-l border-[#d4af37]/15 rounded-bl-full bg-[#d4af37]/5"></div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase bg-[#d4af37]/15 border border-[#d4af37]/30 px-2 py-0.5 rounded-full text-[#d4af37] w-fit shadow-xs">
                              JUZ {cert.exam.juzId}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">{new Date(cert.issuedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                          
                          <div className="text-left">
                            <h4 className="font-extrabold text-slate-200 text-sm tracking-wide leading-tight truncate" title={cert.exam.student.name}>
                              {cert.exam.student.name}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1 font-medium">Level: {cert.exam.student.level?.name || 'Reguler'}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-bold">Skor Ujian: {cert.exam.score}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedCert(cert)}
                          className="w-full bg-[#d4af37]/10 hover:bg-[#d4af37] hover:text-slate-950 text-[#d4af37] font-bold py-2.5 rounded-xl text-xs transition-all border border-[#d4af37]/20 uppercase tracking-wider"
                        >
                          Buka Visual Sertifikat
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'password' && (
              <div className="max-w-md mx-auto bg-slate-950 p-8 border border-slate-800 rounded-3xl space-y-6 text-left animate-fadeIn">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-100">Ubah Password Anda</h3>
                  <p className="text-xs text-slate-400 mt-1">Ubah password login Anda saat ini secara mandiri.</p>
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
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Password Saat Ini</label>
                    <input
                      type="password"
                      name="currentPassword"
                      required
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Password Baru</label>
                    <input
                      type="password"
                      name="newPassword"
                      required
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Konfirmasi Password Baru</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all text-slate-100"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-sm"
                  >
                    Ubah Password
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── 5. Certificate Visual Print/PDF Preview Modal Modal ── */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-50">Visualisasi Sertifikat Kelulusan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Tekan Cetak Sertifikat untuk mencetak atau menyimpannya dalam format PDF.</p>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 p-2 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PREMIUM CLASSIC ARABIC ORNAMENT DIPLOMA WRAPPER */}
            <div className="flex justify-center overflow-x-auto py-4">
              <div
                id="print-area"
                className="w-[297mm] h-[210mm] bg-[#fffdf6] border-[12px] border-double border-[#d4af37] rounded-3xl p-12 text-[#1e293b] flex flex-col justify-between relative shadow-lg tracking-wide select-none shrink-0"
                style={{
                  fontFamily: '"Georgia", serif',
                  backgroundImage: 'radial-gradient(circle, #fffef9 0%, #fffcf2 100%)'
                }}
              >
                {/* Traditional Islamic Golden Border Corners */}
                <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-[#d4af37] rounded-tl-xl"></div>
                <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-[#d4af37] rounded-tr-xl"></div>
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-[#d4af37] rounded-bl-xl"></div>
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-[#d4af37] rounded-br-xl"></div>

                {/* Top Section: Header & Logo */}
                <div className="text-center space-y-3 mt-4">
                  {appLogo ? (
                    <img src={appLogo} alt="Logo" className="w-16 h-16 object-contain rounded-md mx-auto" />
                  ) : (
                    <div className="w-16 h-16 bg-[#d4af37]/10 border-2 border-[#d4af37]/60 rounded-full flex items-center justify-center font-serif text-[#d4af37] font-bold text-2xl mx-auto shadow-sm">
                      S
                    </div>
                  )}
                  <h2 className="text-2xl font-bold tracking-widest text-[#8a6b18] uppercase" style={{ fontFamily: 'Cinzel, Georgia, serif' }}>
                    {appName || 'SITA TAHFIDZ'}
                  </h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">Lembaga Sertifikasi Tahfidzul Qur'an Digital</p>
                  <div className="h-[2px] w-24 bg-[#d4af37] mx-auto mt-2.5"></div>
                </div>

                {/* Middle Section: Recipient & Decree */}
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                  <h1 className="text-3xl font-extrabold text-[#7c631a] tracking-wider my-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    SERTIFIKAT KELULUSAN
                  </h1>
                  <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">Diberikan secara istimewa kepada:</p>
                  
                  <div className="py-2">
                    <h2 className="text-3xl font-black tracking-wide text-slate-900 border-b-2 border-slate-300 pb-2 inline-block px-10">
                      {selectedCert.exam.student.name}
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase mt-2 tracking-wide">Nomor Induk Santri (NIS): {selectedCert.exam.student.nis || '-'}</p>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed max-w-xl mx-auto mt-3">
                    Atas tuntasnya kelayakan ujian hafalan juziyah yang diuji secara langsung dan menyeluruh
                    pada kategori <span className="font-bold text-[#8a6b18]">Juz {selectedCert.exam.juzId}</span> dengan predikat tingkat kelulusan <span className="font-extrabold text-[#8a6b18] uppercase tracking-wider">Sangat Baik (Skor: {selectedCert.exam.score})</span>.
                  </p>
                </div>

                {/* Bottom Section: Footer Signs & Certificate Numbers */}
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
                    <div className="h-10"></div> {/* Space for digital signature */}
                    <div className="w-48 h-[1px] bg-slate-400 mx-auto"></div>
                    <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mt-1">Ustadzah Sarah (Koordinator)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-2xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/10 uppercase tracking-wide"
              >
                <Printer className="w-5 h-5" />
                Cetak Sertifikat / Simpan PDF
              </button>
              <button
                onClick={() => setSelectedCert(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold py-3 px-6 rounded-2xl text-sm transition-colors uppercase tracking-wide"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
