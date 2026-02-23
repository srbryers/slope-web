const API_URL = 'https://caddystack.fly.dev/public/slope-stats';
const POLL_INTERVAL = 60_000;

export interface SlopeStats {
  sprints_completed: number;
  total_tests: number;
  endpoints: number;
  mobile_screens: number;
  rules: number;
  migrations: number;
  handicap: {
    last_5: RollingStats;
    last_10: RollingStats;
    all_time: RollingStats;
  };
  recent_scorecards: ScorecardSummary[];
  miss_pattern: { long: number; short: number; left: number; right: number };
  phase_status: Record<string, string>;
}

interface RollingStats {
  handicap: number;
  fairway_pct: number;
  gir_pct: number;
  avg_putts: number;
}

interface ScorecardSummary {
  sprint: number;
  par: number;
  score: number;
  score_label: string;
  theme: string;
}

// Fallback data baked at build time
const FALLBACK: SlopeStats = {
  sprints_completed: 175,
  total_tests: 3333,
  endpoints: 172,
  mobile_screens: 50,
  rules: 21,
  migrations: 48,
  handicap: {
    last_5: { handicap: 1.2, fairway_pct: 85, gir_pct: 78, avg_putts: 1.4 },
    last_10: { handicap: 1.5, fairway_pct: 82, gir_pct: 75, avg_putts: 1.5 },
    all_time: { handicap: 2.1, fairway_pct: 76, gir_pct: 70, avg_putts: 1.6 },
  },
  recent_scorecards: [
    { sprint: 175, par: 3, score: 3, score_label: 'Par', theme: 'demo exploration' },
    { sprint: 174, par: 3, score: 4, score_label: 'Bogey', theme: 'guided first-project' },
  ],
  miss_pattern: { long: 12, short: 8, left: 5, right: 3 },
  phase_status: {
    phase_1: 'COMPLETE',
    phase_2: 'COMPLETE',
    phase_3: 'COMPLETE',
    phase_4: 'COMPLETE',
    phase_5: '~60%',
    phase_6: 'NOT STARTED',
  },
};

type StatsListener = (stats: SlopeStats) => void;

let currentStats: SlopeStats = FALLBACK;
const listeners: Set<StatsListener> = new Set();
let pollTimer: ReturnType<typeof setInterval> | null = null;

export function getStats(): SlopeStats {
  return currentStats;
}

export function onStatsUpdate(fn: StatsListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyListeners() {
  for (const fn of listeners) {
    try { fn(currentStats); } catch { /* listener error */ }
  }
}

async function fetchStats(): Promise<void> {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) return;
    const data: SlopeStats = await res.json();
    currentStats = data;
    notifyListeners();
  } catch {
    // API unreachable — keep fallback/last known values
  }
}

export function initLiveStats(): void {
  fetchStats();
  if (!pollTimer) {
    pollTimer = setInterval(fetchStats, POLL_INTERVAL);
  }
}
