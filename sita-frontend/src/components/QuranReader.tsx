import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { RotateCcw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { QURAN_PAGE_MAPPINGS, getPageForAyah } from '../lib/pageMappings';

interface Word {
  id: number;
  text: string;
}

interface Ayah {
  id: number;
  ayah_id: number;
  surahId: number;
  text: string;
  words: Word[];
}

interface QuranError {
  id: string;
  type: 'jali' | 'khafi' | 'tark';
  words: { surahId: number; ayahId: number; wordIdx: number; text: string }[];
  note?: string;
}

interface QuranReaderProps {
  selectionMode: 'juz' | 'surah';
  surahId: number;
  startAyah: number;
  endAyah: number;
  juzId?: number;
  startPage?: number;
  endPage?: number;
  onScoreChange: (score: number) => void;
  onErrorsChange?: (errors: any[]) => void;
  scoreInitial?: number;
  penaltyJali?: number;
  penaltyKhafi?: number;
  penaltyTark?: number;
  studentHeatmap?: any[];
}

export const QuranReader: React.FC<QuranReaderProps> = ({
  selectionMode,
  surahId,
  startAyah,
  endAyah,
  startPage = 1,
  endPage = 1,
  onScoreChange,
  onErrorsChange,
  scoreInitial = 100,
  penaltyJali = 3,
  penaltyKhafi = 1,
  penaltyTark = 2,
  studentHeatmap = [],
}) => {
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (selectionMode === 'juz') {
      return Number(startPage) || 1;
    } else {
      return Number(getPageForAyah(surahId, startAyah)) || 1;
    }
  });
  const [pagesList, setPagesList] = useState<number[]>([]);
  const [pagesReady, setPagesReady] = useState(false);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState<number>(24); // Default to 24px
  const [surahNames, setSurahNames] = useState<Record<number, { nameAr: string; nameEn: string }>>({})
  
  // Track selected words: [{ surahId, ayahId, wordIdx, text }]
  const [selectedWords, setSelectedWords] = useState<{ surahId: number; ayahId: number; wordIdx: number; text: string }[]>([]);
  const [showHistoryOverlay, setShowHistoryOverlay] = useState(false);
  
  // Track if we are editing an existing error
  const [editingErrorId, setEditingErrorId] = useState<string | null>(null);
  const [errorNote, setErrorNote] = useState<string>('');

  // Track errors
  const [errors, setErrors] = useState<QuranError[]>([]);

  // Calculate page list and current page based on props
  useEffect(() => {
    setPagesReady(false);
    let list: number[] = [];
    if (selectionMode === 'juz') {
      const startP = Number(startPage) || 1;
      const endP = Number(endPage) || 1;
      for (let p = startP; p <= endP; p++) {
        list.push(p);
      }
    } else {
      // Surah Mode
      const startP = Number(getPageForAyah(surahId, startAyah)) || 1;
      const endP = Number(getPageForAyah(surahId, endAyah)) || 1;
      for (let p = startP; p <= endP; p++) {
        list.push(p);
      }
    }
    setPagesList(list);
    if (list.length > 0) {
      setCurrentPage(list[0]);
    }
    setPagesReady(true);
  }, [selectionMode, surahId, startAyah, endAyah, startPage, endPage]);

  // Fetch ayahs when currentPage changes — but only once pages are ready
  useEffect(() => {
    // Guard: don't fetch if pages haven't been computed yet
    if (!pagesReady || pagesList.length === 0) return;
    // Guard: don't fetch if currentPage is not in the valid page list
    if (!pagesList.includes(currentPage)) return;

    let active = true;
    setLoading(true);
    setSelectedWords([]);
    setEditingErrorId(null);
    
    const ranges = QURAN_PAGE_MAPPINGS[currentPage];
    if (!ranges || ranges.length === 0) {
      setAyahs([]);
      setLoading(false);
      return;
    }

    Promise.all(
      ranges.map((r) => api.getAyahs(r.surahId, r.startAyah, r.endAyah))
    )
      .then((results: any[]) => {
        if (!active) return;
        const mergedAyahs: Ayah[] = [];
        const namesMap: Record<number, { nameAr: string; nameEn: string }> = {};

        results.forEach((res) => {
          const sId = res.surah_id;
          namesMap[sId] = {
            nameAr: res.surah_name_ar,
            nameEn: res.surah_name_id,
          };
          res.ayahs.forEach((a: any) => {
            mergedAyahs.push({
              id: a.id,
              ayah_id: a.ayah_id,
              surahId: sId,
              text: a.text,
              words: a.words,
            });
          });
        });
        setSurahNames((prev) => ({ ...prev, ...namesMap }));
        setAyahs(mergedAyahs);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error('Error fetching ayahs for page:', err);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentPage, pagesReady, pagesList]);

  // Bubble up formatted errors
  const onErrorsChangeRef = React.useRef(onErrorsChange);
  useEffect(() => {
    onErrorsChangeRef.current = onErrorsChange;
  }, [onErrorsChange]);

  useEffect(() => {
    if (onErrorsChangeRef.current) {
      const formattedErrors = errors.map(err => ({
        type: err.type,
        words: err.words.map(w => ({
          surahId: w.surahId,
          ayahId: w.ayahId,
          wordIdx: w.wordIdx,
          text: w.text
        })),
        note: err.note
      }));
      onErrorsChangeRef.current(formattedErrors);
    }
  }, [errors]);

  const calculateScore = (currentErrors: QuranError[]) => {
    console.log("[DEBUG calculateScore] selectionMode:", selectionMode);
    console.log("[DEBUG calculateScore] scoreInitial:", scoreInitial);
    console.log("[DEBUG calculateScore] pagesList:", pagesList);
    console.log("[DEBUG calculateScore] currentErrors:", currentErrors);

    if (selectionMode === 'surah') {
      let penalty = 0;
      currentErrors.forEach((err) => {
        if (err.type === 'jali') penalty += penaltyJali;
        if (err.type === 'tark') penalty += penaltyTark;
        if (err.type === 'khafi') penalty += penaltyKhafi;
      });
      const resScore = Math.max(0, scoreInitial - penalty);
      console.log("[DEBUG calculateScore] surah mode final score:", resScore);
      return resScore;
    } else {
      // Juz Mode: Calculate score per page, then average
      if (pagesList.length === 0) {
        console.log("[DEBUG calculateScore] pagesList is empty, returning initial:", scoreInitial);
        return scoreInitial;
      }

      let totalScoreSum = 0;
      pagesList.forEach((page) => {
        let pagePenalty = 0;
        currentErrors.forEach((err) => {
          if (err.words && err.words.length > 0) {
            const errPage = getPageForAyah(err.words[0].surahId, err.words[0].ayahId);
            console.log(`[DEBUG calculateScore] Comparing errPage: ${errPage} with page: ${page} (Surah: ${err.words[0].surahId}, Ayah: ${err.words[0].ayahId})`);
            if (Number(errPage) === Number(page)) {
              if (err.type === 'jali') pagePenalty += penaltyJali;
              if (err.type === 'tark') pagePenalty += penaltyTark;
              if (err.type === 'khafi') pagePenalty += penaltyKhafi;
            }
          }
        });
        const pageScore = Math.max(0, scoreInitial - pagePenalty);
        console.log(`[DEBUG calculateScore] Page: ${page} -> Score: ${pageScore} (Penalty: ${pagePenalty})`);
        totalScoreSum += pageScore;
      });

      const avg = totalScoreSum / pagesList.length;
      const finalScore = Math.round(avg * 100) / 100;
      console.log("[DEBUG calculateScore] juz mode final average score:", finalScore);
      return finalScore;
    }
  };

  const isWordSelected = (sId: number, aId: number, wordIdx: number) => {
    return selectedWords.some((w) => w.surahId === sId && w.ayahId === aId && w.wordIdx === wordIdx);
  };

  const getWordError = (sId: number, aId: number, wordIdx: number) => {
    return errors.find((err) =>
      err.words.some((w) => w.surahId === sId && w.ayahId === aId && w.wordIdx === wordIdx)
    );
  };

  const isAyahInSelection = (sId: number, aId: number) => {
    if (selectionMode === 'juz') {
      return true; // All pages loaded in Juz mode are part of the target selection
    }
    // Surah mode: check if ayah falls within selected ayah range
    return sId === surahId && aId >= startAyah && aId <= endAyah;
  };

  const handleWordClick = (sId: number, aId: number, wordIdx: number, text: string) => {
    const existingError = getWordError(sId, aId, wordIdx);

    if (existingError) {
      if (editingErrorId === existingError.id) {
        setSelectedWords([]);
        setEditingErrorId(null);
        setErrorNote('');
      } else {
        setSelectedWords(existingError.words);
        setEditingErrorId(existingError.id);
        setErrorNote(existingError.note || '');
      }
    } else {
      if (editingErrorId !== null) {
        setEditingErrorId(null);
        setErrorNote('');
        setSelectedWords([{ surahId: sId, ayahId: aId, wordIdx, text }]);
      } else {
        const isSel = isWordSelected(sId, aId, wordIdx);
        if (isSel) {
          setSelectedWords((prev) => {
            const next = prev.filter((w) => !(w.surahId === sId && w.ayahId === aId && w.wordIdx === wordIdx));
            if (next.length === 0) setErrorNote('');
            return next;
          });
        } else {
          setSelectedWords((prev) => [...prev, { surahId: sId, ayahId: aId, wordIdx, text }]);
        }
      }
    }
  };

  const markError = (type: 'jali' | 'khafi' | 'tark') => {
    if (selectedWords.length === 0) return;

    const newError: QuranError = {
      id: Date.now().toString(),
      type,
      words: [...selectedWords],
      note: errorNote.trim() || undefined,
    };

    const updatedErrors = [...errors, newError];
    setErrors(updatedErrors);
    setSelectedWords([]);
    setErrorNote('');
    
    onScoreChange(calculateScore(updatedErrors));
  };

  const removeError = () => {
    if (editingErrorId === null) return;

    const updatedErrors = errors.filter((err) => err.id !== editingErrorId);
    setErrors(updatedErrors);
    setSelectedWords([]);
    setEditingErrorId(null);
    setErrorNote('');

    onScoreChange(calculateScore(updatedErrors));
  };

  const updateErrorNote = () => {
    if (editingErrorId === null) return;
    const updatedErrors = errors.map((err) => {
      if (err.id === editingErrorId) {
        return { ...err, note: errorNote.trim() || undefined };
      }
      return err;
    });
    setErrors(updatedErrors);
    setSelectedWords([]);
    setEditingErrorId(null);
    setErrorNote('');
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat teks Al-Qur'an...</div>;

  return (
    <div className="relative">
      {/* Top Header Panel: Font Size */}
      <div className="flex justify-between items-center mb-4 select-none">
        <span className="text-xs text-emerald-800 font-extrabold uppercase tracking-wider flex items-center">
          <span className="w-2 h-2 rounded-full bg-emerald-600 mr-1.5 animate-pulse"></span>
          Mode Mushaf Madinah
        </span>
        <div className="flex items-center space-x-3">
          {/* History Overlay Toggle */}
          <button
            type="button"
            onClick={() => setShowHistoryOverlay(!showHistoryOverlay)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center space-x-1.5",
              showHistoryOverlay
                ? "bg-red-50 text-red-750 border-red-200 shadow-sm shadow-red-50/50"
                : "bg-white hover:bg-gray-50 text-gray-600 border-gray-200"
            )}
            title="Tampilkan peta riwayat kesalahan setoran sebelumnya"
          >
            <span className={cn("w-2 h-2 rounded-full", showHistoryOverlay ? "bg-red-500 animate-pulse" : "bg-gray-450")}></span>
            <span>{showHistoryOverlay ? "Sembunyikan Riwayat" : "Riwayat Kesalahan"}</span>
          </button>

          {/* Font Size Adjuster */}
          <div className="flex items-center space-x-2 bg-emerald-50/50 p-1.5 rounded-xl border border-emerald-100">
            <button
            type="button"
            onClick={() => setFontSize((prev) => Math.max(16, prev - 2))}
            className="px-2.5 py-1 text-xs font-black bg-white hover:bg-emerald-100/55 text-emerald-850 rounded-lg shadow-sm border border-emerald-200 transition-all active:scale-95 cursor-pointer"
            title="Kecilkan Font"
          >
            A-
          </button>
          <span className="text-xs font-bold text-emerald-800 px-1">{fontSize}px</span>
          <button
            type="button"
            onClick={() => setFontSize((prev) => Math.min(48, prev + 2))}
            className="px-2.5 py-1 text-xs font-black bg-white hover:bg-emerald-100/55 text-emerald-850 rounded-lg shadow-sm border border-emerald-200 transition-all active:scale-95 cursor-pointer"
            title="Besarkan Font"
          >
            A+
          </button>
        </div>
      </div>
      </div>

      {/* Main Mushaf Sheet */}
      <div className="bg-[#fbf9f4] rounded-[28px] shadow-2xl border-4 border-emerald-800/95 p-8 md:p-12 mb-6 transition-all duration-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div
          className="relative text-justify quran-text drop-shadow-sm leading-loose"
          style={{ fontSize: `${fontSize}px`, lineHeight: 2.5 }}
          dir="rtl"
        >
          {(() => {
            const displayedAyahs = selectionMode === 'surah'
              ? ayahs.filter((a) => a.surahId === surahId)
              : ayahs;
            return displayedAyahs.map((ayah) => {
              const isSelectable = isAyahInSelection(ayah.surahId, ayah.ayah_id);

            // Bismillah split logic
            const isFirstAyah = ayah.ayah_id === 1;
            const isSurah1 = ayah.surahId === 1;
            const isSurah9 = ayah.surahId === 9;
            
            // Check if it has a Bismillah prefix in the first verse (except Surah 1 & 9)
            const hasBismillahPrefix = isFirstAyah && !isSurah1 && !isSurah9 && ayah.words.length >= 4 && 
              (ayah.words[0].text.includes("بِسْمِ") || ayah.words[0].text.includes("بسم"));

            // If it is Surah 1 Ayah 1, it's just the Bismillah itself. We render it centered and selectable.
            if (isSurah1 && isFirstAyah) {
              return (
                <React.Fragment key={ayah.id}>
                  {/* Surah Start Banner */}
                  <div className="w-full text-center my-6 select-none block">
                    <div className="inline-block w-full max-w-lg bg-gradient-to-r from-emerald-800/10 via-emerald-850/5 to-emerald-800/10 border-y-2 border-emerald-800/20 py-3 px-6 rounded-md">
                      <h3 className="font-serif font-black text-emerald-950 text-xl md:text-2xl">
                        {surahNames[ayah.surahId]?.nameAr || 'سورة'}
                      </h3>
                      <p className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-800 mt-1">
                        Surah {surahNames[ayah.surahId]?.nameEn || ''}
                      </p>
                    </div>
                  </div>

                  {/* Centered Bismillah for Surah 1 Ayah 1 */}
                  <div className="w-full text-center my-6 block font-serif font-semibold text-emerald-950/95 leading-normal select-none">
                    {ayah.words.map((word) => {
                      const isSelected = isWordSelected(ayah.surahId, ayah.ayah_id, word.id);
                      const error = getWordError(ayah.surahId, ayah.ayah_id, word.id);
                      const errorType = error ? error.type : null;
                      const heatmapStat = showHistoryOverlay
                        ? studentHeatmap.find(
                            (h) =>
                              h.surahId === ayah.surahId &&
                              h.ayahId === ayah.ayah_id &&
                              h.wordIndex === word.id
                          )
                        : null;

                      return (
                        <React.Fragment key={word.id}>
                          <span
                            onClick={isSelectable ? () => handleWordClick(ayah.surahId, ayah.ayah_id, word.id, word.text) : undefined}
                            className={cn(
                              "px-1 py-0.5 rounded transition-all duration-200 select-none",
                              isSelectable 
                                ? "cursor-pointer hover:bg-emerald-100/40" 
                                : "opacity-45 text-gray-500 cursor-not-allowed",
                              isSelected && "bg-amber-100 hover:bg-amber-200 text-amber-950 font-medium ring-2 ring-amber-300",
                              !isSelected && errorType === 'jali' && "bg-red-50 text-red-700 font-bold border-b-2 border-red-400 hover:bg-red-100",
                              !isSelected && errorType === 'khafi' && "bg-orange-50 text-orange-700 font-semibold border-b-2 border-orange-400 hover:bg-orange-100",
                              !isSelected && errorType === 'tark' && "bg-gray-100 text-gray-600 opacity-80 border-b-2 border-gray-400 hover:bg-gray-200",
                              !isSelected && !errorType && heatmapStat && "bg-red-100/50 border-b border-dashed border-red-300 hover:bg-red-200/50"
                            )}
                            title={heatmapStat ? `Pernah salah ${heatmapStat.count}x (Jali: ${heatmapStat.jaliCount}, Khafi: ${heatmapStat.khafiCount}, Tark: ${heatmapStat.tarkCount})` : undefined}
                          >
                            {word.text}
                          </span>
                          {" "}
                        </React.Fragment>
                      );
                    })}
                    <span className="inline-flex items-center justify-center mx-2 text-emerald-600 font-sans text-xl md:text-2xl opacity-90 select-none">
                      ۝<span className="absolute text-[10px] md:text-xs font-bold pt-1">{ayah.ayah_id}</span>
                    </span>
                  </div>
                </React.Fragment>
              );
            }

            const renderedWords = hasBismillahPrefix ? ayah.words.slice(4) : ayah.words;

            return (
              <React.Fragment key={ayah.id}>
                {/* Surah Start Banner */}
                {ayah.ayah_id === 1 && (
                  <div className="w-full text-center my-6 select-none block">
                    <div className="inline-block w-full max-w-lg bg-gradient-to-r from-emerald-800/10 via-emerald-850/5 to-emerald-800/10 border-y-2 border-emerald-800/20 py-3 px-6 rounded-md">
                      <h3 className="font-serif font-black text-emerald-950 text-xl md:text-2xl">
                        {surahNames[ayah.surahId]?.nameAr || 'سورة'}
                      </h3>
                      <p className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-800 mt-1">
                        Surah {surahNames[ayah.surahId]?.nameEn || ''}
                      </p>
                    </div>
                  </div>
                )}

                {/* Centered Bismillah Header for other Surahs */}
                {hasBismillahPrefix && (
                  <div className="w-full text-center my-6 block font-serif font-semibold text-emerald-950/95 leading-normal select-none">
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </div>
                )}

                {/* Ayah Words */}
                {renderedWords.map((word) => {
                  const isSelected = isWordSelected(ayah.surahId, ayah.ayah_id, word.id);
                  const error = getWordError(ayah.surahId, ayah.ayah_id, word.id);
                  const errorType = error ? error.type : null;
                  const heatmapStat = showHistoryOverlay
                    ? studentHeatmap.find(
                        (h) =>
                          h.surahId === ayah.surahId &&
                          h.ayahId === ayah.ayah_id &&
                          h.wordIndex === word.id
                      )
                    : null;

                  return (
                    <React.Fragment key={word.id}>
                      <span
                        onClick={isSelectable ? () => handleWordClick(ayah.surahId, ayah.ayah_id, word.id, word.text) : undefined}
                        className={cn(
                          "px-1 py-0.5 rounded transition-all duration-200 select-none",
                          isSelectable 
                            ? "cursor-pointer hover:bg-emerald-100/40" 
                            : "opacity-45 text-gray-500 cursor-not-allowed",
                          isSelected && "bg-amber-100 hover:bg-amber-200 text-amber-950 font-medium ring-2 ring-amber-300",
                          !isSelected && errorType === 'jali' && "bg-red-50 text-red-700 font-bold border-b-2 border-red-400 hover:bg-red-100",
                          !isSelected && errorType === 'khafi' && "bg-orange-50 text-orange-700 font-semibold border-b-2 border-orange-400 hover:bg-orange-100",
                          !isSelected && errorType === 'tark' && "bg-gray-100 text-gray-600 opacity-80 border-b-2 border-gray-400 hover:bg-gray-200",
                          !isSelected && !errorType && heatmapStat && "bg-red-100/50 border-b border-dashed border-red-300 hover:bg-red-200/50"
                        )}
                        title={heatmapStat ? `Pernah salah ${heatmapStat.count}x (Jali: ${heatmapStat.jaliCount}, Khafi: ${heatmapStat.khafiCount}, Tark: ${heatmapStat.tarkCount})` : undefined}
                      >
                        {word.text}
                      </span>
                      {" "}
                    </React.Fragment>
                  );
                })}
                
                {/* Ayah End Marker */}
                <span className={cn(
                  "inline-flex items-center justify-center mx-2 text-emerald-600 font-sans text-xl md:text-2xl opacity-90 select-none",
                  !isSelectable && "opacity-40"
                )}>
                  ۝<span className="absolute text-[10px] md:text-xs font-bold pt-1">{ayah.ayah_id}</span>
                </span>
                {" "}
              </React.Fragment>
            );
            });
          })()}
        </div>

        {/* Page Number Footer */}
        <div className="mt-10 border-t border-emerald-800/10 pt-5 text-center select-none">
          <span className="font-serif font-black text-lg text-emerald-850/60 bg-emerald-50/50 px-4.5 py-2 rounded-full border border-emerald-800/5">
            {currentPage}
          </span>
        </div>
      </div>

      {/* RTL Page Navigation Bar at the Bottom */}
      {pagesList.length > 1 && (
        <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-100 rounded-2xl p-2.5 mb-28 select-none max-w-md mx-auto gap-4">
          {/* Next Page Button (Left Side for RTL page navigation) */}
          <button
            type="button"
            disabled={currentPage === pagesList[pagesList.length - 1]}
            onClick={() => {
              const idx = pagesList.indexOf(currentPage);
              if (idx < pagesList.length - 1) {
                setCurrentPage(pagesList[idx + 1]);
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
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="bg-emerald-50/50 border border-emerald-250 rounded-lg text-xs font-black text-emerald-950 py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm cursor-pointer transition-all"
            >
              {pagesList.map((p) => (
                <option key={p} value={p}>
                  Hal. {p}
                </option>
              ))}
            </select>
          </div>

          {/* Previous Page Button (Right Side for RTL page navigation) */}
          <button
            type="button"
            disabled={currentPage === pagesList[0]}
            onClick={() => {
              const idx = pagesList.indexOf(currentPage);
              if (idx > 0) {
                setCurrentPage(pagesList[idx - 1]);
              }
            }}
            className="p-2.5 bg-white hover:bg-emerald-50 disabled:opacity-30 disabled:hover:bg-white text-emerald-850 rounded-xl shadow-sm border border-emerald-150 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
            title="Halaman Sebelumnya"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Floating Error Markup Toolbar */}
      {selectedWords.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.12)] border border-gray-200 p-4 transition-all duration-300 transform scale-100">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full">
                  {selectedWords.length} Kata Terpilih
                </span>
                {editingErrorId !== null && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" /> Edit Kesalahan
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {editingErrorId !== null ? (
                  <>
                    <button
                      type="button"
                      onClick={removeError}
                      className="flex-1 sm:flex-initial flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-red-200 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 mr-1.5" /> Hapus Kesalahan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWords([]);
                        setEditingErrorId(null);
                        setErrorNote('');
                      }}
                      className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => markError('jali')}
                      className="flex items-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
                      Jali (-{penaltyJali})
                    </button>
                    <button
                      type="button"
                      onClick={() => markError('khafi')}
                      className="flex items-center px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-orange-500 mr-1.5"></span>
                      Khafi (-{penaltyKhafi})
                    </button>
                    <button
                      type="button"
                      onClick={() => markError('tark')}
                      className="flex items-center px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-gray-500 mr-1.5"></span>
                      Tark (-{penaltyTark})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWords([]);
                        setErrorNote('');
                      }}
                      className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-500 font-semibold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Note Input Field */}
            <div className="w-full border-t border-gray-100 pt-3 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={errorNote}
                onChange={(e) => setErrorNote(e.target.value)}
                placeholder="Tambah catatan kesalahan (misal: 'Dengung kurang panjang', 'Salah harakat')"
                className="flex-1 bg-gray-50/50 border border-gray-250 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-sans"
              />
              {editingErrorId !== null && (
                <button
                  type="button"
                  onClick={updateErrorNote}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-100 cursor-pointer font-sans"
                >
                  Simpan Catatan
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
