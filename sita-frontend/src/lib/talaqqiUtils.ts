import { getPageForAyah } from './pageMappings';

export interface SpacedRepetitionPage {
  pageNumber: number;
  weight: number;
  jaliCount: number;
  tarkCount: number;
  khafiCount: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  value?: string | number;
}

export const calculateSpacedRepetition = (
  sessions: any[],
  targetJuzs: number[]
): SpacedRepetitionPage[] => {
  const pageWeights: Record<number, { weight: number; jali: number; tark: number; khafi: number }> = {};

  // Find all page ranges for target Juzs
  const targetPages = new Set<number>();
  targetJuzs.forEach(juz => {
    const start = juz === 1 ? 1 : juz === 30 ? 582 : 22 + (juz - 2) * 20;
    const end = juz === 1 ? 21 : juz === 30 ? 604 : start + 19;
    for (let p = start; p <= end; p++) {
      targetPages.add(p);
    }
  });

  sessions.forEach(s => {
    const isTargetJuz = targetJuzs.length === 0 || targetJuzs.includes(s.juzId);
    if (!isTargetJuz) return;

    const errors = s.errors || [];
    errors.forEach((err: any) => {
      const page = getPageForAyah(err.surahId, err.ayahId);
      if (targetPages.size > 0 && !targetPages.has(page)) return;

      if (!pageWeights[page]) {
        pageWeights[page] = { weight: 0, jali: 0, tark: 0, khafi: 0 };
      }

      if (err.errorType === 'jali') {
        pageWeights[page].weight += 3;
        pageWeights[page].jali += 1;
      } else if (err.errorType === 'tark') {
        pageWeights[page].weight += 2;
        pageWeights[page].tark += 1;
      } else if (err.errorType === 'khafi') {
        pageWeights[page].weight += 1;
        pageWeights[page].khafi += 1;
      }
    });
  });

  return Object.entries(pageWeights)
    .map(([pageStr, stats]) => ({
      pageNumber: parseInt(pageStr),
      weight: stats.weight,
      jaliCount: stats.jali,
      tarkCount: stats.tark,
      khafiCount: stats.khafi,
    }))
    .filter(p => p.weight > 0)
    .sort((a, b) => b.weight - a.weight);
};

export const calculateBadges = (sessions: any[]): Badge[] => {
  const passedSessions = sessions.filter(s => s.status === 'lulus');
  
  // Calculate streak from passed sessions
  let currentStreak = 0;
  if (passedSessions.length > 0) {
    const dates = passedSessions.map(s => new Date(s.createdAt).toDateString());
    const uniqueDates = Array.from(new Set(dates)).map(d => new Date(d));
    uniqueDates.sort((a, b) => b.getTime() - a.getTime()); // desc

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let expectedDate = today;
    const lastSessionDate = uniqueDates[0];
    if (lastSessionDate) {
      lastSessionDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        expectedDate = lastSessionDate;
        currentStreak = 1;
        let dateIdx = 1;

        while (dateIdx < uniqueDates.length) {
          const nextDate = uniqueDates[dateIdx];
          nextDate.setHours(0, 0, 0, 0);
          const expectedPrev = new Date(expectedDate);
          expectedPrev.setDate(expectedPrev.getDate() - 1);

          if (nextDate.getTime() === expectedPrev.getTime()) {
            currentStreak++;
            expectedDate = nextDate;
            dateIdx++;
          } else {
            break;
          }
        }
      }
    }
  }

  const perfectScores = passedSessions.filter(s => s.scoreFinal >= 95).length;
  const tasmiCount = passedSessions.filter(s => s.setoranScope === 'tasmi_juz').length;
  const solidTajweedCount = passedSessions.filter(s => s.errorJaliCount === 0).length;

  return [
    {
      id: 'daily_streak',
      name: 'Pejuang Harian',
      description: 'Menyetor hafalan berturut-turut',
      icon: '🔥',
      color: 'from-orange-500 to-amber-500',
      unlocked: currentStreak >= 3,
      value: `${currentStreak} Hari`,
    },
    {
      id: 'mutqin_sejati',
      name: 'Santri Mutqin',
      description: 'Mendapat nilai setoran ≥ 95',
      icon: '💎',
      color: 'from-cyan-500 to-blue-500',
      unlocked: perfectScores > 0,
      value: `${perfectScores} Kali`,
    },
    {
      id: 'tasmi_master',
      name: 'Penakluk Juz',
      description: 'Lulus ujian Tasmi\' 1 Juz Penuh',
      icon: '👑',
      color: 'from-purple-500 to-indigo-500',
      unlocked: tasmiCount > 0,
      value: `${tasmiCount} Juz`,
    },
    {
      id: 'solid_tajweed',
      name: 'Tajwid Kokoh',
      description: 'Lulus setoran tanpa kesalahan Jali',
      icon: '🛡️',
      color: 'from-emerald-500 to-teal-500',
      unlocked: solidTajweedCount > 0,
      value: `${solidTajweedCount} Kali`,
    },
  ];
};
