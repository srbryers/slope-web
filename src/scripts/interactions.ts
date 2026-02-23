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

/** Initialize all interactions */
export function initInteractions(): void {
  initParCalculator();
  initShotCycle();
}
