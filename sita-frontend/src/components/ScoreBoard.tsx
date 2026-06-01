import React from 'react';

interface ScoreBoardProps {
  score: number;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ score }) => {
  const isPassed = score >= 80;

  return (
    <div className="sticky top-4 z-40 mx-auto max-w-sm mb-8 mt-2 transition-all-smooth">
      <div className="bg-white/80 backdrop-blur-xl rounded-full p-3 pr-5 pl-6 flex items-center justify-between border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <p className="text-xs text-gray-500 font-semibold tracking-wider uppercase">Skor</p>
            <p className="text-3xl font-black text-gray-800 leading-none">{score}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`px-4 py-2 rounded-full text-sm font-bold tracking-wide shadow-sm transition-colors ${isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {isPassed ? 'LULUS' : 'MENGULANG'}
          </div>
        </div>
      </div>
    </div>
  );
};
