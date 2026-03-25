const API_URL = 'https://slope-stats.srbryers.workers.dev/stats';
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
export const FALLBACK_SPRINTS = 69;

const FALLBACK: SlopeStats = {
  sprints_completed: 69,
  total_tests: 167,
  cli_commands: 48,
  guards: 29,
  packages: 6,
  metaphors: 7,
  handicap: {
    last_5: { handicap: 1.2, fairway_pct: 78.9, gir_pct: 78.9, avg_putts: 0 },
    last_10: { handicap: 0.3, fairway_pct: 83.7, gir_pct: 83.7, avg_putts: 0 },
    all_time: { handicap: 0.2, fairway_pct: 97.2, gir_pct: 89.3, avg_putts: 0.5 },
  },
  recent_scorecards: [
    { sprint: 69, par: 3, score: 5, score_label: 'double_bogey', theme: 'The Patch Kit — S68 Carryover Fixes' },
    { sprint: 68, par: 4, score: 4, score_label: 'par', theme: 'The Fence — Workflow Engine Test Coverage' },
    { sprint: 67, par: 4, score: 7, score_label: 'triple_plus', theme: 'The Skill Shelf — Skill System Restructuring' },
    { sprint: 66, par: 4, score: 4, score_label: 'par', theme: 'The Scorekeeper — Sprint Analytics Dashboard' },
    { sprint: 65, par: 4, score: 5, score_label: 'bogey', theme: 'The Inspiration Engine' },
  ],
  miss_pattern: { long: 0, short: 0, left: 0, right: 0 },
  phase_status: {},
  latest_scorecard: {
    sprint: 69,
    par: 3,
    score: 5,
    score_label: 'double_bogey',
    theme: 'The Patch Kit — S68 Carryover Fixes',
    stats: { fairway_hits: 4, fairway_total: 4, gir: 4, hazards_hit: 4 },
  },
  handicap_milestones: [
    { sprint: 5, handicap: 0 },
    { sprint: 10, handicap: 0.6 },
    { sprint: 15, handicap: 0.4 },
    { sprint: 20, handicap: 0.3 },
    { sprint: 25, handicap: 0.2 },
    { sprint: 30, handicap: 0.2 },
    { sprint: 35, handicap: 0.2 },
    { sprint: 40, handicap: 0.2 },
    { sprint: 45, handicap: 0.2 },
    { sprint: 50, handicap: 0.3 },
    { sprint: 55, handicap: 0.1 },
    { sprint: 60, handicap: 0.2 },
    { sprint: 65, handicap: 0.2 },
    { sprint: 69, handicap: 0.2 },
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
