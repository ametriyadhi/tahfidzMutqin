import React, { useState, useEffect } from 'react';
import { useSitaDocumentation } from '../hooks/useQueries';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface DocumentationPhoto {
  id: number;
  title: string;
  imageUrl: string;
  tag?: string;
}

const DEFAULT_SLIDES: DocumentationPhoto[] = [
  {
    id: -1,
    title: 'Keceriaan Setoran Akhir Pekan Santri SITA',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800',
    tag: 'Halaqah Sore'
  },
  {
    id: -2,
    title: 'Pemberian Mahkota Kemuliaan kepada Orang Tua',
    imageUrl: 'https://images.unsplash.com/photo-1584281729058-ded3d6b0a61f?q=80&w=800',
    tag: 'Wisuda Tahfidz'
  },
  {
    id: -3,
    title: 'Ujian Juziyah Serentak Semester Genap',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800',
    tag: 'Ujian Nasional'
  }
];

export const SitaActivitiesSlider: React.FC = () => {
  const { data: uploadedPhotos = [], isLoading } = useSitaDocumentation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeSlides = uploadedPhotos.length > 0 ? uploadedPhotos : DEFAULT_SLIDES;

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSlides]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  if (isLoading) {
    return (
      <div className="aspect-[16/9] w-full rounded-2xl bg-slate-900 border border-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400 font-bold">
        Memuat dokumentasi kegiatan SITA...
      </div>
    );
  }

  const currentSlide = activeSlides[currentIndex];

  return (
    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-lg group select-none transition-all duration-300">
      
      {/* Photo Render */}
      <img
        src={currentSlide.imageUrl}
        alt={currentSlide.title}
        className="w-full h-full object-cover opacity-80 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
      />

      {/* Gradient Vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-4 flex flex-col justify-end text-left">
        {currentSlide.tag && (
          <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 w-fit mb-1 shadow-sm uppercase tracking-wider">
            {currentSlide.tag}
          </span>
        )}
        <p className="text-xs md:text-sm font-extrabold text-white leading-tight drop-shadow-md truncate max-w-[85%]">
          {currentSlide.title}
        </p>
      </div>

      {/* Slider Manual Arrows - visible on hover */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 border border-white/10 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-xs cursor-pointer z-10"
            title="Slide Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 border border-white/10 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-xs cursor-pointer z-10"
            title="Slide Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Pagination Indicators (Dots) */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-3 right-4 flex items-center gap-1.5 z-10">
          {activeSlides.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                currentIndex === idx ? "w-4 bg-emerald-500" : "w-1.5 bg-white/40 hover:bg-white/60"
              )}
              title={`Buka Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
