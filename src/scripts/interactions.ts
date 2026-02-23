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

/** Inline metaphor showcase — pills in "See It In Action" that re-render a sprint card */
export function initInlineSwitcher(): void {
  const pills = document.querySelectorAll<HTMLElement>('[data-inline-metaphor]');
  const line1 = document.getElementById('inline-card-line1');
  const line2 = document.getElementById('inline-card-line2');
  const line3 = document.getElementById('inline-card-line3');

  if (!pills.length || !line1 || !line2 || !line3) return;

  // Card content per metaphor — same data, different vocabulary
  const cards: Record<string, { line1: string; line2: string; line3: string }> = {
    golf: {
      line1: 'Par 4, Score 4',
      line2: 'Fairway: 4/4 | GIR: 3/4 | Bunkers: 1',
      line3: 'Handicap: 1.2 \u2014 trending down',
    },
    tennis: {
      line1: 'Game Point, Set Won',
      line2: 'In Play: 4/4 | Winners: 3/4 | Double Faults: 1',
      line3: 'Ranking: 1.2 \u2014 trending up',
    },
    baseball: {
      line1: 'Inning 4, On Base',
      line2: 'Singles: 4/4 | Doubles: 3/4 | Pickles: 1',
      line3: 'Batting Avg: 1.2 \u2014 trending up',
    },
    gaming: {
      line1: 'Level 4, B-Rank Clear',
      line2: 'Progress: 4/4 | Clears: 3/4 | Traps: 1',
      line3: 'Player Stats: 1.2 \u2014 leveling up',
    },
    dnd: {
      line1: 'CR 4, Hit',
      line2: 'Hits: 4/4 | Crits: 3/4 | Traps: 1',
      line3: 'Character Level: 1.2 \u2014 gaining XP',
    },
    matrix: {
      line1: 'Simulation 4, Connected',
      line2: 'Connected: 4/4 | Decoded: 3/4 | Firewalls: 1',
      line3: 'Operator Rating: 1.2 \u2014 signal strong',
    },
  };

  function activate(metaphorId: string) {
    const card = cards[metaphorId];
    if (!card) return;

    line1!.textContent = card.line1;
    line2!.textContent = card.line2;
    line3!.textContent = card.line3;

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
  if (cards[saved]) activate(saved);
}

/** Initialize all interactions */
export function initInteractions(): void {
  initParCalculator();
  initShotCycle();
}
