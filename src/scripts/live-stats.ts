const API_URL = 'https://caddystack.fly.dev/public/slope-stats';
const POLL_INTERVAL = 60_000;

export interface LatestScorecard {
  sprint: number;
  par: number;
  score: number;
  score_label: string;
  theme: string;
  stats: {
    fairway_hits: number;
    fairway_total: number;
    gir: number;
    hazards_hit: number;
  };
}

export interface HandicapMilestone {
  sprint: number;
  handicap: number;
}

export interface SlopeStats {
  sprints_completed: number;
  total_tests: number;
  cli_commands: number;
  guards: number;
  packages: number;
  metaphors: number;
  handicap: {
    last_5: RollingStats;
    last_10: RollingStats;
    all_time: RollingStats;
  };
  recent_scorecards: ScorecardSummary[];
  miss_pattern: { long: number; short: number; left: number; right: number };
  phase_status: Record<string, string>;
  latest_scorecard: LatestScorecard | null;
  handicap_milestones: HandicapMilestone[];
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

// Fallback data baked at build time — single source of truth for initial render
export const FALLBACK_SPRINTS = 28;

const FALLBACK: SlopeStats = {
  sprints_completed: 28,
  total_tests: 1173,
  cli_commands: 27,
  guards: 13,
  packages: 1,
  metaphors: 7,
  handicap: {
    last_5: { handicap: 1.0, fairway_pct: 90, gir_pct: 82, avg_putts: 1.3 },
    last_10: { handicap: 1.2, fairway_pct: 86, gir_pct: 78, avg_putts: 1.4 },
    all_time: { handicap: 1.5, fairway_pct: 80, gir_pct: 74, avg_putts: 1.5 },
  },
  recent_scorecards: [
    { sprint: 28, par: 4, score: 4, score_label: 'par', theme: 'The Pro Tour' },
    { sprint: 27, par: 4, score: 4, score_label: 'par', theme: 'web + tokens' },
  ],
  miss_pattern: { long: 10, short: 6, left: 4, right: 3 },
  phase_status: {
    phase_1: 'COMPLETE',
    phase_2: 'COMPLETE',
    phase_3: 'COMPLETE',
    phase_4: 'COMPLETE',
    phase_5: '~75%',
    phase_6: '~20%',
  },
  latest_scorecard: {
    sprint: 28,
    par: 4,
    score: 4,
    score_label: 'par',
    theme: 'The Pro Tour',
    stats: { fairway_hits: 4, fairway_total: 4, gir: 3, hazards_hit: 1 },
  },
  handicap_milestones: [
    { sprint: 5, handicap: 3.2 },
    { sprint: 10, handicap: 2.5 },
    { sprint: 15, handicap: 2.0 },
    { sprint: 20, handicap: 1.8 },
    { sprint: 25, handicap: 1.4 },
    { sprint: 28, handicap: 1.2 },
  ],
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
