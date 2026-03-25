/**
 * Dynamic OG image for getslope.dev — fetches live stats and renders a mini dashboard.
 * Uses satori (JSX → SVG) + resvg (SVG → PNG). Generates at build time.
 */
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// --- Helpers ---

type Child = VNode | string;
interface VNode { type: string; props: Record<string, unknown> }
function h(type: string, style: Record<string, unknown>, ...children: Child[]): VNode {
  return { type, props: { style, children: children.length === 1 ? children[0] : children } };
}

// --- Colors (from global.css tokens) ---

const BG = '#0F1210';
const SURFACE = '#161B17';
const CARD = '#1C221D';
const EMERALD = '#4AE68A';
const GOLD = '#D4A843';
const FOREST = '#1B5E3B';
const TEXT_PRIMARY = '#F0EDE6';
const TEXT_SECONDARY = '#8B9A8E';
const TEXT_MUTED = '#5A6B5E';
const BORDER = '#2A332C';

// --- Stats types (mirror live-stats.ts) ---

interface RollingStats { handicap: number; fairway_pct: number; gir_pct: number; avg_putts: number }
interface ScorecardSummary { sprint: number; par: number; score: number; score_label: string; theme: string }
interface HandicapMilestone { sprint: number; handicap: number }
interface SlopeStats {
  sprints_completed: number;
  total_tests: number;
  cli_commands: number;
  guards: number;
  handicap: { last_5: RollingStats; last_10: RollingStats; all_time: RollingStats };
  recent_scorecards: ScorecardSummary[];
  handicap_milestones: HandicapMilestone[];
}

const FALLBACK: SlopeStats = {
  sprints_completed: 69,
  total_tests: 167,
  cli_commands: 48,
  guards: 29,
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
  ],
  handicap_milestones: [
    { sprint: 5, handicap: 0 }, { sprint: 10, handicap: 0.6 },
    { sprint: 20, handicap: 0.3 }, { sprint: 30, handicap: 0.2 },
    { sprint: 40, handicap: 0.2 }, { sprint: 50, handicap: 0.3 },
    { sprint: 60, handicap: 0.2 }, { sprint: 69, handicap: 0.2 },
  ],
};

async function fetchStats(): Promise<SlopeStats> {
  try {
    const res = await fetch('https://slope-stats.srbryers.workers.dev/stats');
    if (!res.ok) return FALLBACK;
    return await res.json() as SlopeStats;
  } catch {
    return FALLBACK;
  }
}

// --- Score label colors ---

function labelColor(label: string): string {
  switch (label) {
    case 'eagle': case 'birdie': return EMERALD;
    case 'par': return GOLD;
    default: return '#E06B5E';
  }
}

function diffStr(score: number, par: number): string {
  const d = score - par;
  return d > 0 ? `+${d}` : d === 0 ? 'E' : `${d}`;
}

// --- Mini handicap trend sparkline (satori-native SVG elements) ---

function buildSparkline(milestones: HandicapMilestone[]): VNode {
  if (milestones.length < 2) return h('div', { display: 'flex', height: 70 });

  const W = 460, H = 70;
  const PAD = { top: 6, bottom: 6, left: 4, right: 4 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const vals = milestones.map(m => m.handicap);
  const minV = Math.min(...vals, 0);
  const maxV = Math.max(...vals, 1);
  const range = Math.max(maxV - minV, 0.5);

  const coords = milestones.map((m, i) => ({
    x: PAD.left + (i / (milestones.length - 1)) * plotW,
    y: PAD.top + plotH - ((m.handicap - minV) / range) * plotH,
  }));

  const linePoints = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaD = `M${PAD.left},${PAD.top + plotH} L${coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' L')} L${PAD.left + plotW},${PAD.top + plotH} Z`;
  const lastPt = coords[coords.length - 1];

  // Build using satori's supported SVG element tree
  const svgNode: VNode = {
    type: 'svg',
    props: {
      viewBox: `0 0 ${W} ${H}`,
      width: W,
      height: H,
      style: { display: 'flex' },
      children: [
        { type: 'path', props: { d: areaD, fill: `${EMERALD}22` } },
        { type: 'polyline', props: { points: linePoints, fill: 'none', stroke: EMERALD, 'stroke-width': '2.5', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } },
        { type: 'circle', props: { cx: lastPt.x.toFixed(1), cy: lastPt.y.toFixed(1), r: '4', fill: EMERALD } },
      ],
    },
  };

  return svgNode;
}

// --- Stat card ---

function statCard(value: string, label: string, accent = EMERALD): VNode {
  return h('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: '14px 20px',
    flex: 1,
  },
    h('span', {
      display: 'flex',
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 32,
      fontWeight: 800,
      color: accent,
    }, value),
    h('span', {
      display: 'flex',
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: 500,
      color: TEXT_MUTED,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: 4,
    }, label),
  );
}

// --- Recent scorecards row ---

function scorecardRow(sc: ScorecardSummary): VNode {
  return h('div', {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 0',
  },
    // Sprint number
    h('span', {
      display: 'flex',
      fontFamily: 'Geist Mono',
      fontSize: 12,
      fontWeight: 500,
      color: TEXT_MUTED,
      width: 32,
    }, `S${sc.sprint}`),
    // Theme
    h('span', {
      display: 'flex',
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: 400,
      color: TEXT_SECONDARY,
      flex: 1,
      overflow: 'hidden',
    }, sc.theme.length > 42 ? sc.theme.slice(0, 40) + '\u2026' : sc.theme),
    // Score
    h('span', {
      display: 'flex',
      fontFamily: 'Geist Mono',
      fontSize: 12,
      fontWeight: 500,
      color: labelColor(sc.score_label),
    }, diffStr(sc.score, sc.par)),
  );
}

// --- Main layout ---

function buildOGImage(stats: SlopeStats): VNode {
  const all = stats.handicap.all_time;

  return h('div', {
    display: 'flex',
    width: '100%',
    height: '100%',
    background: BG,
    fontFamily: 'Inter',
  },
    // Emerald accent bar (left edge)
    h('div', {
      display: 'flex',
      width: 4,
      height: '100%',
      background: EMERALD,
    }),

    // Content
    h('div', {
      display: 'flex',
      flex: 1,
      padding: '44px 50px 44px 46px',
      gap: 50,
    },
      // Left column: branding + stats
      h('div', {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: 440,
        flexShrink: 0,
      },
        // Top: branding
        h('div', {
          display: 'flex',
          flexDirection: 'column',
        },
          h('span', {
            display: 'flex',
            fontFamily: 'Plus Jakarta Sans',
            fontSize: 52,
            fontWeight: 800,
            color: TEXT_PRIMARY,
            letterSpacing: -1,
          }, 'SLOPE'),
          h('span', {
            display: 'flex',
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: 400,
            color: TEXT_SECONDARY,
            marginTop: 6,
          }, 'Sprint Lifecycle & Operational Performance Engine'),
          h('span', {
            display: 'flex',
            fontFamily: 'Inter',
            fontSize: 14,
            fontWeight: 400,
            color: TEXT_MUTED,
            marginTop: 10,
            lineHeight: 1.5,
          }, 'Quantified sprint metrics for AI-assisted development. Scorecards, handicap tracking, and real-time agent guidance.'),
        ),

        // Middle: stat cards row
        h('div', {
          display: 'flex',
          gap: 12,
          marginTop: 24,
        },
          statCard(`${stats.sprints_completed}`, 'Sprints'),
          statCard(`${all.fairway_pct}%`, 'Accuracy'),
          statCard(`${all.handicap}`, 'Handicap'),
        ),

        // Bottom: domain
        h('span', {
          display: 'flex',
          fontFamily: 'Geist Mono',
          fontSize: 14,
          fontWeight: 500,
          color: EMERALD,
          opacity: 0.7,
          marginTop: 20,
        }, 'getslope.dev'),
      ),

      // Right column: recent scorecards + sparkline
      h('div', {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'space-between',
      },
        // Recent sprints card
        h('div', {
          display: 'flex',
          flexDirection: 'column',
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          padding: '18px 20px',
          flex: 1,
        },
          h('span', {
            display: 'flex',
            fontFamily: 'Inter',
            fontSize: 11,
            fontWeight: 600,
            color: TEXT_MUTED,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginBottom: 12,
          }, 'Recent Sprints'),

          // Scorecard rows
          ...stats.recent_scorecards.slice(0, 4).map(scorecardRow),

          // Sparkline placeholder label
          h('div', {
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            paddingTop: 16,
            borderTop: `1px solid ${BORDER}`,
          },
            h('span', {
              display: 'flex',
              fontFamily: 'Inter',
              fontSize: 11,
              fontWeight: 600,
              color: TEXT_MUTED,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginBottom: 8,
            }, 'Handicap Trend'),
            // Inline SVG sparkline
            buildSparkline(stats.handicap_milestones),
          ),
        ),
      ),
    ),

    // Bottom emerald bar
    h('div', {
      display: 'flex',
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: 3,
      background: FOREST,
    }),
  );
}

// --- Font loading ---

async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&display=swap`;
  const cssRes = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  });
  const css = await cssRes.text();
  const match = css.match(/src: url\(([^)]+)\)/);
  if (!match) throw new Error(`No font URL found for ${family} ${weight}`);
  const fontRes = await fetch(match[1]);
  return fontRes.arrayBuffer();
}

// --- Endpoint ---

export async function GET() {
  const [stats, jakartaMedium, jakartaBold, interRegular, interSemibold, monoRegular] = await Promise.all([
    fetchStats(),
    loadGoogleFont('Plus Jakarta Sans', 500),
    loadGoogleFont('Plus Jakarta Sans', 800),
    loadGoogleFont('Inter', 400),
    loadGoogleFont('Inter', 600),
    loadGoogleFont('Geist Mono', 400),
  ]);

  const fonts = [
    { name: 'Plus Jakarta Sans', data: jakartaMedium, weight: 500 as const, style: 'normal' as const },
    { name: 'Plus Jakarta Sans', data: jakartaBold, weight: 800 as const, style: 'normal' as const },
    { name: 'Inter', data: interRegular, weight: 400 as const, style: 'normal' as const },
    { name: 'Inter', data: interSemibold, weight: 600 as const, style: 'normal' as const },
    { name: 'Geist Mono', data: monoRegular, weight: 400 as const, style: 'normal' as const },
    { name: 'Geist Mono', data: monoRegular, weight: 500 as const, style: 'normal' as const },
  ];

  const svg = await satori(buildOGImage(stats) as React.ReactNode, {
    width: 1200,
    height: 630,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });

  const png = resvg.render().asPng();

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
