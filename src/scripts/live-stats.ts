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
export const FALLBACK_SPRINTS = 64;

const FALLBACK: SlopeStats = {
  sprints_completed: 64,
  total_tests: 149,
  cli_commands: 45,
  guards: 22,
  packages: 6,
  metaphors: 7,
  handicap: {
    last_5: { handicap: 0, fairway_pct: 87.5, gir_pct: 87.5, avg_putts: 0 },
    last_10: { handicap: 0.2, fairway_pct: 93.9, gir_pct: 93.9, avg_putts: 0 },
    all_time: { handicap: 0.2, fairway_pct: 98.5, gir_pct: 90.1, avg_putts: 0.5 },
  },
  recent_scorecards: [
    { sprint: 64, par: 5, score: 5, score_label: 'par', theme: 'Claim Hygiene, Worktree Safety & Loop Planner Context' },
    { sprint: 63, par: 5, score: 3, score_label: 'eagle', theme: 'The Handbook + Template Integration' },
    { sprint: 62, par: 5, score: 5, score_label: 'par', theme: 'The Welcome Mat v2 + Templates' },
    { sprint: 61, par: 3, score: 2, score_label: 'birdie', theme: 'The Terminal Caddy — OB1 Adapter' },
    { sprint: 60, par: 3, score: 3, score_label: 'par', theme: 'Compaction-proof review gates + worktree-merge guard' },
  ],
  miss_pattern: { long: 3, short: 2, left: 3, right: 3 },
  phase_status: {},
  latest_scorecard: {
    sprint: 64,
    par: 5,
    score: 5,
    score_label: 'par',
    theme: 'Claim Hygiene, Worktree Safety & Loop Planner Context',
    stats: { fairway_hits: 5, fairway_total: 5, gir: 5, hazards_hit: 1 },
  },
  handicap_milestones: [
    { sprint: 5, handicap: 0.8 },
    { sprint: 10, handicap: 0.3 },
    { sprint: 15, handicap: 0.3 },
    { sprint: 20, handicap: 0.3 },
    { sprint: 25, handicap: 0.2 },
    { sprint: 30, handicap: 0.2 },
    { sprint: 40, handicap: 0.2 },
    { sprint: 50, handicap: 0.3 },
    { sprint: 60, handicap: 0.2 },
    { sprint: 64, handicap: 0.2 },
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
