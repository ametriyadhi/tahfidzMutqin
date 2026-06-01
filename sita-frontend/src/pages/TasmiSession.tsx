// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { 
  PlayCircle, StopCircle, Mic, ArrowLeft, BookOpen, User, Users, 
  Save, AlertCircle, RefreshCw, Play, X
} from 'lucide-react';
import { QuranReader } from '../components/QuranReader';
import { useBranding } from '../context/BrandingContext';
import { QURAN_PAGE_MAPPINGS, getPageForAyah } from '../lib/pageMappings';
import { useSurahs, useFinishSession } from '../hooks/useQueries';

const getJuzPageRange = (juz: number) => {
  if (juz === 1) return { start: 1, end: 21 };
  if (juz === 30) return { start: 582, end: 604 };
  const start = 22 + (juz - 2) * 20;
  return { start, end: start + 19 };
};

const getSurahTotalAyahs = (surahId: number): number => {
  let maxAyah = 0;
  for (const ranges of Object.values(QURAN_PAGE_MAPPINGS)) {
    for (const range of ranges) {
      if (range.surahId === surahId && range.endAyah > maxAyah) {
        maxAyah = range.endAyah;
      }
    }
  }
  return maxAyah || 7;
};

export const TasmiSession: React.FC = () => {
  const navigate = useNavigate();
  const user = api.getUser();
  const { appName, setPageTitle } = useBranding();

  useEffect(() => {
    setPageTitle("Mushaf Tasmi'");
  }, [setPageTitle]);

  // General State
  const [tasmiMode, setTasmiMode] = useState<'mandiri' | 'teman' | null>(null);
  const [selectionMode, setSelectionMode] = useState<'juz' | 'surah'>('surah');
  const { data: surahs = [] } = useSurahs();
  
  // Selection
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(7);
  
  const [juzId, setJuzId] = useState<number>(30);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [endPage, setEndPage] = useState<number>(604);

  // Flow State
  const [step, setStep] = useState<'setup' | 'recording' | 'review' | 'teman_review'>('setup');
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [startPage, setStartPage] = useState<number>(582);

  // Scoring & Errors
  const [score, setScore] = useState(100);
  const [errors, setErrors] = useState<any[]>([]);
  const finishSessionMutation = useFinishSession();

  // Update bounds when selection changes
  useEffect(() => {
    if (selectionMode === 'surah') {
      const maxAyahs = getSurahTotalAyahs(selectedSurah);
      if (startAyah > maxAyahs) setStartAyah(1);
      if (endAyah > maxAyahs) setEndAyah(maxAyahs);
      if (startAyah > endAyah) setEndAyah(startAyah);
    } else {
      const range = getJuzPageRange(juzId);
      if (startPage < range.start || startPage > range.end) setStartPage(range.start);
      if (endPage < range.start || endPage > range.end) setEndPage(range.end);
      if (startPage > endPage) setEndPage(startPage);
    }
  }, [selectedSurah, juzId, selectionMode, startAyah, endAyah, startPage, endPage]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/mp4';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStep('recording');
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Tidak dapat mengakses mikrofon. Pastikan Anda telah memberikan izin.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks to release microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      setStep('review');
    }
  };

  const handleRetake = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setScore(100);
    setErrors([]);
    setStep('setup');
  };

  const startTemanMode = () => {
    setStep('teman_review');
  };

  const handleSaveTasmi = async () => {
    if (!user) return;
    try {
      await finishSessionMutation.mutateAsync({
        studentId: user.id,
        surahId: selectedSurah,
        startAyah,
        endAyah,
        sessionType: tasmiMode === 'mandiri' ? 'tasmi_mandiri' : 'tasmi_teman',
        errors,
        juzId: selectionMode === 'juz' ? juzId : undefined,
        setoranScope: selectionMode === 'juz' ? 'halaman' : undefined,
        pageNumber: selectionMode === 'juz' ? startPage : undefined,
        startPage: selectionMode === 'juz' ? startPage : undefined,
        endPage: selectionMode === 'juz' ? endPage : undefined,
        scoreFinal: score,
        status: score >= 80 ? 'lulus' : 'mengulang',
        notesUstadz: `Tasmi' ${tasmiMode === 'mandiri' ? 'Mandiri' : 'Teman'}`
      });
      alert('Sesi Tasmi berhasil disimpan!');
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan sesi');
    }
  };

  const renderSetup = () => (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Mulai Tasmi'</h2>
        <p className="text-gray-500 mb-8">Pilih mode tasmi' yang ingin Anda lakukan.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setTasmiMode('mandiri')}
            className={cn(
              "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all",
              tasmiMode === 'mandiri' ? "border-emerald-500 bg-emerald-50" : "border-gray-100 hover:border-emerald-200 hover:bg-gray-50"
            )}
          >
            <User className={cn("w-12 h-12 mb-3", tasmiMode === 'mandiri' ? "text-emerald-600" : "text-gray-400")} />
            <span className="font-bold text-lg text-gray-800">Tasmi' Mandiri</span>
            <span className="text-sm text-gray-500 mt-1 text-center">Rekam suara Anda, lalu dengarkan dan koreksi sendiri.</span>
          </button>
          
          <button
            onClick={() => setTasmiMode('teman')}
            className={cn(
              "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all",
              tasmiMode === 'teman' ? "border-emerald-500 bg-emerald-50" : "border-gray-100 hover:border-emerald-200 hover:bg-gray-50"
            )}
          >
            <Users className={cn("w-12 h-12 mb-3", tasmiMode === 'teman' ? "text-emerald-600" : "text-gray-400")} />
            <span className="font-bold text-lg text-gray-800">Tasmi' Teman</span>
            <span className="text-sm text-gray-500 mt-1 text-center">Berikan perangkat ke teman Anda untuk menyimak dan mengoreksi.</span>
          </button>
        </div>
      </div>

      {tasmiMode && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Pilih Ayat/Halaman yang Akan Dibaca</h3>
          
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setSelectionMode('surah')}
              className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", selectionMode === 'surah' ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            >
              Mode Surah
            </button>
            <button
              onClick={() => setSelectionMode('juz')}
              className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", selectionMode === 'juz' ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            >
              Mode Juz/Halaman
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {selectionMode === 'surah' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Surah</label>
                  <select
                    value={selectedSurah}
                    onChange={(e) => setSelectedSurah(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800"
                  >
                    {surahs.map(s => <option key={s.id} value={s.id}>{s.id}. {s.nameEn}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ayat Mulai</label>
                  <select
                    value={startAyah}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setStartAyah(val);
                      if (endAyah < val) setEndAyah(val);
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800"
                  >
                    {Array.from({ length: getSurahTotalAyahs(selectedSurah) }, (_, i) => i + 1).map(a => (
                      <option key={a} value={a}>Ayat {a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ayat Selesai</label>
                  <select
                    value={endAyah}
                    onChange={(e) => setEndAyah(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800"
                  >
                    {Array.from({ length: getSurahTotalAyahs(selectedSurah) }, (_, i) => i + 1)
                      .filter(a => a >= startAyah)
                      .map(a => (
                        <option key={a} value={a}>Ayat {a}</option>
                      ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Juz</label>
                  <select
                    value={juzId}
                    onChange={(e) => setJuzId(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(j => <option key={j} value={j}>Juz {j}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Halaman Mulai</label>
                  <select
                    value={startPage}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setStartPage(val);
                      if (endPage < val) setEndPage(val);
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800"
                  >
                    {(() => {
                      const range = getJuzPageRange(juzId);
                      return Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start + i).map(p => (
                        <option key={p} value={p}>Halaman {p}</option>
                      ));
                    })()}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Halaman Selesai</label>
                  <select
                    value={endPage}
                    onChange={(e) => setEndPage(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800"
                  >
                    {(() => {
                      const range = getJuzPageRange(juzId);
                      return Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start + i)
                        .filter(p => p >= startPage)
                        .map(p => (
                          <option key={p} value={p}>Halaman {p}</option>
                        ));
                    })()}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end">
            {tasmiMode === 'mandiri' ? (
              <button
                onClick={handleStartRecording}
                className="flex items-center space-x-2 bg-red-500 text-white hover:bg-red-600 px-6 py-3 rounded-xl font-bold shadow-md transition-all"
              >
                <Mic className="w-5 h-5" />
                <span>Mulai Merekam</span>
              </button>
            ) : (
              <button
                onClick={startTemanMode}
                className="flex items-center space-x-2 bg-emerald-600 text-white hover:bg-emerald-700 px-6 py-3 rounded-xl font-bold shadow-md transition-all"
              >
                <PlayCircle className="w-5 h-5" />
                <span>Mulai Simakan</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-16">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-emerald-600 rounded-full hover:bg-emerald-50 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-black">
                T
              </div>
              <h1 className="font-extrabold text-gray-900 text-lg">Mushaf Tasmi'</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {step === 'setup' && renderSetup()}

        {step === 'recording' && (
          <div className="max-w-2xl mx-auto text-center space-y-8 mt-16">
            <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Mic className="w-16 h-16 text-red-500" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-800 mb-2">Sedang Merekam...</h2>
              <p className="text-gray-500 text-lg">Silakan membaca hafalan Anda.</p>
            </div>
            <button
              onClick={handleStopRecording}
              className="inline-flex items-center space-x-3 bg-red-500 text-white hover:bg-red-600 px-8 py-4 rounded-2xl font-bold shadow-lg transition-all"
            >
              <StopCircle className="w-6 h-6" />
              <span>Selesai & Hentikan Rekaman</span>
            </button>
          </div>
        )}

        {(step === 'review' || step === 'teman_review') && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Tools */}
            <div className="lg:col-span-1 space-y-6">
              {step === 'review' && audioUrl && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                  <h3 className="font-bold text-gray-800 mb-4">Rekaman Tasmi'</h3>
                  <p className="text-xs text-gray-500 mb-4">Dengarkan kembali bacaan Anda melalui pemutar di pojok kanan bawah dan catat kesalahan pada Mushaf di sebelah kanan.</p>
                  <button
                    onClick={handleRetake}
                    className="flex items-center justify-center space-x-2 w-full px-4 py-2 border-2 border-gray-200 text-gray-600 hover:border-emerald-500 hover:text-emerald-600 rounded-xl font-bold transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Ulangi Rekaman</span>
                  </button>
                </div>
              )}

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Skor Saat Ini</div>
                <div className="text-5xl font-black text-emerald-600 mb-4">{score}</div>
                <div className="text-xs text-gray-500 mb-6">Total {errors.length} Kesalahan tercatat</div>
                
                <button
                  onClick={handleSaveTasmi}
                  disabled={finishSessionMutation.isPending}
                  className="flex items-center justify-center space-x-2 w-full bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-3 rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{finishSessionMutation.isPending ? 'Menyimpan...' : 'Simpan Tasmi'}</span>
                </button>
              </div>

              <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-orange-900 text-sm mb-1">Cara Mencatat Kesalahan</h4>
                    <p className="text-xs text-orange-800 leading-relaxed">
                      Klik (tap) pada kata Al-Qur'an yang salah di Mushaf untuk mencatat Jali, Khafi, atau Tark.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quran Reader */}
            <div className="lg:col-span-3">
              <QuranReader
                selectionMode={selectionMode}
                surahId={selectedSurah}
                startAyah={startAyah}
                endAyah={endAyah}
                juzId={juzId}
                startPage={startPage}
                endPage={endPage}
                onScoreChange={setScore}
                onErrorsChange={setErrors}
                scoreInitial={100}
                penaltyJali={3}
                penaltyKhafi={1}
                penaltyTark={2}
              />
            </div>
          </div>
        )}

        {/* Floating Audio Player */}
        {step === 'review' && audioUrl && (
          <div className="fixed bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-full shadow-2xl p-2 border border-gray-200 flex items-center space-x-3 z-50">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <PlayCircle className="w-5 h-5" />
            </div>
            <audio controls src={audioUrl} className="h-10 w-48 sm:w-64 outline-none" />
          </div>
        )}
      </main>
    </div>
  );
};
