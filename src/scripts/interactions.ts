/** Par calculator slider interaction */
export function initParCalculator(): void {
  const slider = document.getElementById('par-slider') as HTMLInputElement | null;
  const ticketDisplay = document.getElementById('par-ticket-count');
  const parDisplay = document.getElementById('par-value');
  const slopeVisual = document.getElementById('slope-visual');

  if (!slider || !ticketDisplay || !parDisplay) return;

  function update() {
    const tickets = parseInt(slider!.value, 10);
    ticketDisplay!.textContent = String(tickets);

    let par: number;
    if (tickets <= 2) par = 3;
    else if (tickets <= 4) par = 4;
    else par = 5;

    parDisplay!.textContent = `Par ${par}`;
    parDisplay!.className = par === 3
      ? 'text-emerald font-bold text-4xl font-heading transition-all'
      : par === 4
      ? 'text-gold font-bold text-4xl font-heading transition-all'
      : 'text-red-400 font-bold text-4xl font-heading transition-all';

    // Update slope visual
    if (slopeVisual) {
      const level = tickets <= 2 ? 'flat' : tickets <= 4 ? 'hilly' : 'mountain';
      slopeVisual.setAttribute('data-terrain', level);
    }
  }

  slider.addEventListener('input', update);
  update();
}

/** Shot cycle step highlighting */
export function initShotCycle(): void {
  const steps = document.querySelectorAll<HTMLElement>('[data-cycle-step]');
  let activeIndex = 0;
  let interval: ReturnType<typeof setInterval> | null = null;

  function activate(index: number) {
    steps.forEach((s, i) => {
      s.classList.toggle('opacity-100', i === index);
      s.classList.toggle('opacity-40', i !== index);
      s.classList.toggle('scale-105', i === index);
      s.classList.toggle('scale-100', i !== index);
    });
  }

  function startAutoplay() {
    interval = setInterval(() => {
      activeIndex = (activeIndex + 1) % steps.length;
      activate(activeIndex);
    }, 2500);
  }

  steps.forEach((step, i) => {
    step.addEventListener('mouseenter', () => {
      if (interval) clearInterval(interval);
      activeIndex = i;
      activate(i);
    });
    step.addEventListener('mouseleave', () => {
      startAutoplay();
    });
  });

  if (steps.length > 0) {
    activate(0);
    startAutoplay();
  }
}

/** Install command tab toggle */
export function initInstallToggle(): void {
  const commands: Record<string, string> = {
    npm: 'npm install -g @srbryers/cli',
    pnpm: 'pnpm add -g @srbryers/cli',
    bun: 'bun add -g @srbryers/cli',
  };

  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-pkg]');
  const cmdEl = document.querySelector<HTMLElement>('[data-install-cmd]');
  const copyBtn = document.querySelector<HTMLButtonElement>('[data-install-copy]');

  if (!buttons.length || !cmdEl) return;

  const saved = localStorage.getItem('slope-pkg-manager');
  const initial = saved && commands[saved] ? saved : 'npm';

  function activate(id: string) {
    buttons.forEach((btn) => {
      const isActive = btn.dataset.pkg === id;
      btn.classList.toggle('bg-emerald/10', isActive);
      btn.classList.toggle('text-emerald', isActive);
      btn.classList.toggle('border', isActive);
      btn.classList.toggle('border-emerald/20', isActive);
      btn.classList.toggle('text-text-muted', !isActive);
    });
    if (cmdEl) cmdEl.textContent = commands[id];
    localStorage.setItem('slope-pkg-manager', id);
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const pkg = btn.dataset.pkg;
      if (pkg) activate(pkg);
    });
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const text = cmdEl?.textContent ?? '';
      navigator.clipboard.writeText(text).then(() => {
        const svg = copyBtn.querySelector('svg');
        if (svg) {
          const original = svg.innerHTML;
          svg.innerHTML = '<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />';
          setTimeout(() => { svg.innerHTML = original; }, 1500);
        }
      });
    });
  }

  activate(initial);
}

/** Shared metaphor apply logic — updates data-term elements + persists selection */
function applyMetaphor(
  metaphorId: string,
  metaphors: Record<string, Record<string, Record<string, string>>>,
): void {
  const els = document.querySelectorAll<HTMLElement>('[data-term]');
  els.forEach((el) => {
    const term = el.dataset.term;
    if (!term) return;
    const parts = term.split('.');
    let obj: unknown = metaphors[metaphorId];
    for (const p of parts) {
      if (obj && typeof obj === 'object') obj = (obj as Record<string, unknown>)[p];
      else { obj = undefined; break; }
    }
    if (typeof obj === 'string') el.textContent = obj;
  });
  localStorage.setItem('slope-metaphor', metaphorId);
  document.documentElement.dataset.metaphor = metaphorId;

  // Sync global dropdown if present
  const dropdown = document.getElementById('metaphor-select') as HTMLSelectElement | null;
  if (dropdown) dropdown.value = metaphorId;

  // Sync inline pills if present
  const pills = document.querySelectorAll<HTMLElement>('[data-inline-metaphor]');
  pills.forEach((pill) => {
    const isActive = pill.dataset.inlineMetaphor === metaphorId;
    pill.classList.toggle('border-emerald/40', isActive);
    pill.classList.toggle('bg-emerald/10', isActive);
    pill.classList.toggle('text-emerald', isActive);
    pill.classList.toggle('border-border', !isActive);
    pill.classList.toggle('bg-bg-card', !isActive);
    pill.classList.toggle('text-text-muted', !isActive);
  });
}

/** Metaphor switcher — swaps data-term elements based on selected metaphor */
export function initMetaphorSwitcher(): void {
  const dropdown = document.getElementById('metaphor-select') as HTMLSelectElement | null;
  if (!dropdown) return;

  import('../data/metaphors.json').then((mod) => {
    const metaphors: Record<string, Record<string, Record<string, string>>> = mod.default;

    dropdown.addEventListener('change', () => applyMetaphor(dropdown.value, metaphors));

    const saved = localStorage.getItem('slope-metaphor') ?? 'golf';
    if (metaphors[saved]) applyMetaphor(saved, metaphors);
  });
}

/** Metaphor vocabulary for card line generation */
interface MetaphorVocab {
  line1: (par: number, score: number, label: string) => string;
  line2: (fh: number, ft: number, gir: number, par: number, hazards: number) => string;
  line3: (handicap: number) => string;
}

const metaphorVocabs: Record<string, MetaphorVocab> = {
  golf: {
    line1: (par, score) => `Par ${par}, Score ${score}`,
    line2: (fh, ft, gir, par, hz) => `Fairway: ${fh}/${ft} | GIR: ${gir}/${par} | Bunkers: ${hz}`,
    line3: (h) => `Handicap: ${h.toFixed(1)} \u2014 trending down`,
  },
  tennis: {
    line1: (_par, _score, label) => `Game Point, ${label === 'par' || label === 'birdie' || label === 'eagle' ? 'Set Won' : 'Deuce'}`,
    line2: (fh, ft, gir, par, hz) => `In Play: ${fh}/${ft} | Winners: ${gir}/${par} | Double Faults: ${hz}`,
    line3: (h) => `Ranking: ${h.toFixed(1)} \u2014 trending up`,
  },
  baseball: {
    line1: (par) => `Inning ${par}, On Base`,
    line2: (fh, ft, gir, par, hz) => `Singles: ${fh}/${ft} | Doubles: ${gir}/${par} | Pickles: ${hz}`,
    line3: (h) => `Batting Avg: ${h.toFixed(1)} \u2014 trending up`,
  },
  gaming: {
    line1: (par, score) => `Level ${par}, ${score <= par ? 'S' : 'B'}-Rank Clear`,
    line2: (fh, ft, gir, par, hz) => `Progress: ${fh}/${ft} | Clears: ${gir}/${par} | Traps: ${hz}`,
    line3: (h) => `Player Stats: ${h.toFixed(1)} \u2014 leveling up`,
  },
  dnd: {
    line1: (par) => `CR ${par}, Hit`,
    line2: (fh, ft, gir, par, hz) => `Hits: ${fh}/${ft} | Crits: ${gir}/${par} | Traps: ${hz}`,
    line3: (h) => `Character Level: ${h.toFixed(1)} \u2014 gaining XP`,
  },
  matrix: {
    line1: (par) => `Simulation ${par}, Connected`,
    line2: (fh, ft, gir, par, hz) => `Connected: ${fh}/${ft} | Decoded: ${gir}/${par} | Firewalls: ${hz}`,
    line3: (h) => `Operator Rating: ${h.toFixed(1)} \u2014 signal strong`,
  },
};

/** Inline metaphor showcase — pills in "See It In Action" that re-render a sprint card */
export function initInlineSwitcher(): void {
  const pills = document.querySelectorAll<HTMLElement>('[data-inline-metaphor]');
  const line1 = document.getElementById('inline-card-line1');
  const line2 = document.getElementById('inline-card-line2');
  const line3 = document.getElementById('inline-card-line3');
  const headerEl = document.getElementById('inline-card-header');

  if (!pills.length || !line1 || !line2 || !line3) return;

  // Live scorecard data — updated from API
  let scorecard = {
    sprint: 28,
    par: 4,
    score: 4,
    score_label: 'par',
    handicap: 1.2,
    stats: { fairway_hits: 4, fairway_total: 4, gir: 3, hazards_hit: 1 },
  };

  // Subscribe to live stats for real scorecard data
  import('../scripts/live-stats').then(({ onStatsUpdate, getStats }) => {
    function applyScorecard(stats: ReturnType<typeof getStats>) {
      if (stats.latest_scorecard) {
        const sc = stats.latest_scorecard;
        scorecard = {
          sprint: sc.sprint,
          par: sc.par,
          score: sc.score,
          score_label: sc.score_label,
          handicap: stats.handicap.all_time.handicap,
          stats: sc.stats,
        };
        // Update header with real sprint number
        if (headerEl) headerEl.textContent = `Sprint ${sc.sprint} Summary`;
        // Re-render with current metaphor
        const current = localStorage.getItem('slope-metaphor') ?? 'golf';
        renderCard(current);
      }
    }

    // Apply from current stats immediately
    applyScorecard(getStats());
    // Subscribe to future updates
    onStatsUpdate(applyScorecard);
  });

  function buildCardLines(metaphorId: string): { line1: string; line2: string; line3: string } {
    const vocab = metaphorVocabs[metaphorId] ?? metaphorVocabs.golf;
    const { par, score, score_label, handicap, stats } = scorecard;
    return {
      line1: vocab.line1(par, score, score_label),
      line2: vocab.line2(stats.fairway_hits, stats.fairway_total, stats.gir, par, stats.hazards_hit),
      line3: vocab.line3(handicap),
    };
  }

  function renderCard(metaphorId: string) {
    const card = buildCardLines(metaphorId);
    line1!.textContent = card.line1;
    line2!.textContent = card.line2;
    line3!.textContent = card.line3;
  }

  function activate(metaphorId: string) {
    renderCard(metaphorId);

    // Update pill styles
    pills.forEach((pill) => {
      const isActive = pill.dataset.inlineMetaphor === metaphorId;
      pill.classList.toggle('border-emerald/40', isActive);
      pill.classList.toggle('bg-emerald/10', isActive);
      pill.classList.toggle('text-emerald', isActive);
      pill.classList.toggle('border-border', !isActive);
      pill.classList.toggle('bg-bg-card', !isActive);
      pill.classList.toggle('text-text-muted', !isActive);
    });

    // Sync with global metaphor state + data-term elements
    import('../data/metaphors.json').then((mod) => {
      const metaphors: Record<string, Record<string, Record<string, string>>> = mod.default;
      applyMetaphor(metaphorId, metaphors);
    });
  }

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const id = pill.dataset.inlineMetaphor;
      if (id) activate(id);
    });
  });

  // Initialize from saved preference
  const saved = localStorage.getItem('slope-metaphor') ?? 'golf';
  activate(saved);
}

/** Initialize all interactions */
export function initInteractions(): void {
  initParCalculator();
  initShotCycle();
}
