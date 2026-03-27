// Guide page engine — state machine and DOM controller for the IAE walkthrough.

import { GUIDE_STEPS, GUIDE_PHASES } from '../data/guide-steps';

interface GuideState {
  currentStepIndex: number;
  visitedSteps: Set<number>;
  selectedFilePath: string | null;
}

const state: GuideState = {
  currentStepIndex: -1,
  visitedSteps: new Set(),
  selectedFilePath: null,
};

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const STORAGE_KEY = 'slope-guide-state';

// ---------------------------------------------------------------------------
// DOM references (cached on init)
// ---------------------------------------------------------------------------

let messagesEl: HTMLElement;
let continueBtn: HTMLButtonElement;
let continueTxt: HTMLElement;
let inputArea: HTMLElement;
let completeEl: HTMLElement;
let artifactPathEl: HTMLElement;
let artifactContentEl: HTMLElement;
let treeOverlay: HTMLElement;

// ---------------------------------------------------------------------------
// Syntax highlighting (JSON)
// ---------------------------------------------------------------------------

function highlightJson(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Keys
    .replace(/("[\w$]+")(\s*:)/g, '<span class="guide-tok-key">$1</span>$2')
    // String values (after colon)
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, (match, str) =>
      match.replace(str, `<span class="guide-tok-str">${str}</span>`))
    // Array string values
    .replace(/\[\s*"(?:[^"\\]|\\.)*"/g, (match) =>
      match.replace(/"(?:[^"\\]|\\.)*"/g, (s) => `<span class="guide-tok-str">${s}</span>`))
    .replace(/,\s*"(?:[^"\\]|\\.)*"/g, (match) =>
      match.replace(/"(?:[^"\\]|\\.)*"/g, (s) => {
        if (s.includes('guide-tok')) return s;
        return `<span class="guide-tok-str">${s}</span>`;
      }))
    // Numbers
    .replace(/:\s*(\d+(?:\.\d+)?)/g, (match, num) =>
      match.replace(num, `<span class="guide-tok-num">${num}</span>`))
    // Booleans & null
    .replace(/:\s*(true|false|null)\b/g, (match, val) =>
      match.replace(val, `<span class="guide-tok-bool">${val}</span>`));
}

function highlightContent(raw: string, language: string): string {
  if (language === 'json') return highlightJson(raw);
  // Plain text / other — just escape HTML
  return raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------------------------------------------------------------------------
// File tree
// ---------------------------------------------------------------------------

function revealTreeFiles(stepIndex: number) {
  const entries = document.querySelectorAll<HTMLElement>(`[data-guide-file-step="${stepIndex}"]`);
  entries.forEach(el => {
    if (!el.classList.contains('hidden')) return;
    el.classList.remove('hidden');
    // Brief highlight for newly revealed files
    if (!prefersReducedMotion && el.dataset.guideFileType === 'file') {
      el.style.backgroundColor = 'rgba(74, 230, 138, 0.12)';
      setTimeout(() => {
        el.style.transition = 'background-color 1.5s';
        el.style.backgroundColor = '';
      }, 50);
    }
  });
}

function selectTreeFile(path: string) {
  document.querySelectorAll<HTMLElement>('[data-guide-file]').forEach(el => {
    el.classList.toggle('active', el.dataset.guideFile === path);
  });
}

// ---------------------------------------------------------------------------
// Artifact preview
// ---------------------------------------------------------------------------

function showArtifact(path: string) {
  state.selectedFilePath = path;
  selectTreeFile(path);

  const tpl = document.querySelector<HTMLTemplateElement>(`[data-guide-artifact="${path}"]`);
  if (!tpl || !artifactContentEl || !artifactPathEl) return;

  const raw = tpl.content.textContent?.trim() ?? '';
  const lang = tpl.dataset.guideArtifactLang ?? 'text';
  const highlighted = highlightContent(raw, lang);

  artifactPathEl.textContent = path;
  artifactContentEl.innerHTML = `<pre class="font-mono text-xs leading-relaxed whitespace-pre overflow-x-auto"><code>${highlighted}</code></pre>`;
}

// ---------------------------------------------------------------------------
// Phase bar
// ---------------------------------------------------------------------------

function updatePhaseBar() {
  const currentPhase = state.currentStepIndex >= 0 && state.currentStepIndex < GUIDE_STEPS.length
    ? GUIDE_STEPS[state.currentStepIndex].phase
    : null;

  // Build set of visited phase IDs
  const visitedPhases = new Set<string>();
  for (const idx of state.visitedSteps) {
    if (idx < GUIDE_STEPS.length) visitedPhases.add(GUIDE_STEPS[idx].phase);
  }

  GUIDE_PHASES.forEach((phase, i) => {
    const btn = document.querySelector<HTMLElement>(`[data-guide-phase="${phase.id}"]`);
    const dot = btn?.querySelector('.guide-phase-dot');
    const line = document.querySelector<HTMLElement>(`[data-guide-phase-line="${i}"]`);
    if (!btn || !dot) return;

    const isCurrent = phase.id === currentPhase;
    const isVisited = visitedPhases.has(phase.id);

    // Dot state
    dot.classList.toggle('active', isCurrent);
    dot.classList.toggle('visited', isVisited && !isCurrent);
    dot.classList.toggle('future', !isCurrent && !isVisited);

    // Label styling
    btn.classList.toggle('text-emerald', isCurrent);
    btn.classList.toggle('font-bold', isCurrent);
    btn.classList.toggle('text-text-secondary', isVisited && !isCurrent);
    btn.classList.toggle('cursor-pointer', isVisited);
    btn.classList.toggle('text-text-muted', !isCurrent && !isVisited);
    btn.classList.toggle('cursor-default', !isVisited);

    // Phase line
    if (line) {
      line.classList.toggle('bg-emerald/30', isVisited || isCurrent);
      line.classList.toggle('bg-border', !isVisited && !isCurrent);
    }
  });
}

// ---------------------------------------------------------------------------
// Typing animation — staggered reveal of agent response blocks
// ---------------------------------------------------------------------------

function typeReveal(agentEl: HTMLElement, onComplete: () => void) {
  // Find the content div inside the agent bubble
  const bubble = agentEl.querySelector('.guide-agent-bubble');
  if (!bubble) { onComplete(); return; }

  const contentDiv = bubble.querySelector('div');
  if (!contentDiv) { onComplete(); return; }

  // Get all direct children (p, pre, ul, etc.)
  const children = Array.from(contentDiv.children) as HTMLElement[];
  if (children.length === 0) { onComplete(); return; }

  // Hide all children initially
  children.forEach(child => {
    child.style.opacity = '0';
    child.style.transform = 'translateY(4px)';
  });

  // Reveal them one by one with stagger
  let i = 0;
  const interval = 80; // ms between each block

  function revealNext() {
    if (i >= children.length) {
      onComplete();
      return;
    }
    const child = children[i];
    child.style.transition = 'opacity 0.2s, transform 0.2s';
    child.style.opacity = '1';
    child.style.transform = 'translateY(0)';
    i++;
    scrollChatToBottom();
    setTimeout(revealNext, interval);
  }

  revealNext();
}

function showPostAgentContent(step: typeof GUIDE_STEPS[number], index: number) {
  // Show branch buttons
  const branchesEl = document.querySelector<HTMLElement>(`[data-guide-branches="${step.id}"]`);
  if (branchesEl) branchesEl.classList.remove('hidden');

  // Reveal file tree entries for this step
  if (step.artifacts) {
    revealTreeFiles(index);
    showArtifact(step.artifacts[0].path);
  }

  // Update phase bar
  updatePhaseBar();

  // Update continue button
  updateContinueButton();

  // Scroll to bottom of chat
  scrollChatToBottom();

  // Persist progress
  saveState();
}

// ---------------------------------------------------------------------------
// Core: advance to step
// ---------------------------------------------------------------------------

function advanceToStep(index: number) {
  if (index >= GUIDE_STEPS.length) {
    showCompletion();
    return;
  }
  if (index < 0) return;

  state.currentStepIndex = index;
  state.visitedSteps.add(index);

  const step = GUIDE_STEPS[index];
  const stepEl = document.querySelector<HTMLElement>(`[data-guide-step="${step.id}"]`);
  if (!stepEl) return;

  // Show the user message
  stepEl.classList.remove('hidden');

  // Reveal agent response after a short delay
  const agentEl = document.querySelector<HTMLElement>(`[data-guide-agent="${step.id}"]`);
  const delay = prefersReducedMotion ? 0 : 300;

  setTimeout(() => {
    if (agentEl) {
      agentEl.classList.remove('hidden');
      // Staggered reveal of agent response content
      if (!prefersReducedMotion) {
        typeReveal(agentEl, () => {
          showPostAgentContent(step, index);
        });
      } else {
        showPostAgentContent(step, index);
      }
    } else {
      showPostAgentContent(step, index);
    }
  }, delay);

  // Scroll to show user message immediately
  requestAnimationFrame(() => {
    stepEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  });
}

// ---------------------------------------------------------------------------
// Branches
// ---------------------------------------------------------------------------

function showBranch(stepId: string, branchIndex: number) {
  const key = `${stepId}-${branchIndex}`;

  // Hide the clicked branch button
  const btn = document.querySelector<HTMLElement>(`[data-guide-branch="${key}"]`);
  if (btn) btn.classList.add('hidden');

  // Show branch response
  const responseEl = document.querySelector<HTMLElement>(`[data-guide-branch-response="${key}"]`);
  if (!responseEl) return;
  responseEl.classList.remove('hidden');

  // Scroll to branch response
  requestAnimationFrame(() => {
    responseEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  });

  // Persist progress
  saveState();
}

// ---------------------------------------------------------------------------
// Completion
// ---------------------------------------------------------------------------

function showCompletion() {
  if (completeEl) completeEl.classList.remove('hidden');
  if (inputArea) inputArea.classList.add('hidden');
  updatePhaseBar();
  scrollChatToBottom();
}

// ---------------------------------------------------------------------------
// Continue button
// ---------------------------------------------------------------------------

function updateContinueButton() {
  const nextIndex = state.currentStepIndex + 1;
  if (nextIndex >= GUIDE_STEPS.length) {
    if (continueTxt) continueTxt.textContent = 'Finish tour';
  } else {
    if (continueTxt) continueTxt.textContent = GUIDE_STEPS[nextIndex].userPrompt;
  }
}

// ---------------------------------------------------------------------------
// Phase jumping
// ---------------------------------------------------------------------------

function jumpToPhase(phaseId: string) {
  // Find the first step with this phase that we've visited
  const targetIndex = GUIDE_STEPS.findIndex(s => s.phase === phaseId);
  if (targetIndex < 0 || !state.visitedSteps.has(targetIndex)) return;

  const step = GUIDE_STEPS[targetIndex];
  const stepEl = document.querySelector<HTMLElement>(`[data-guide-step="${step.id}"]`);
  if (stepEl) {
    stepEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  }
}

// ---------------------------------------------------------------------------
// Mobile tree toggle
// ---------------------------------------------------------------------------

function toggleMobileTree(show: boolean) {
  if (treeOverlay) {
    treeOverlay.classList.toggle('hidden', !show);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scrollChatToBottom() {
  if (!messagesEl) return;
  requestAnimationFrame(() => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}

// ---------------------------------------------------------------------------
// State persistence
// ---------------------------------------------------------------------------

function saveState() {
  try {
    const data = {
      currentStepIndex: state.currentStepIndex,
      visitedSteps: [...state.visitedSteps],
      openedBranches: [...document.querySelectorAll<HTMLElement>('[data-guide-branch].hidden')]
        .map(el => el.dataset.guideBranch)
        .filter(Boolean),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* storage full or unavailable */ }
}

function restoreState(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (typeof data.currentStepIndex !== 'number' || data.currentStepIndex < 0) return false;

    // Replay all visited steps instantly (no animation)
    const maxStep = Math.min(data.currentStepIndex, GUIDE_STEPS.length - 1);
    for (let i = 0; i <= maxStep; i++) {
      state.currentStepIndex = i;
      state.visitedSteps.add(i);
      const step = GUIDE_STEPS[i];
      const stepEl = document.querySelector<HTMLElement>(`[data-guide-step="${step.id}"]`);
      const agentEl = document.querySelector<HTMLElement>(`[data-guide-agent="${step.id}"]`);
      const branchesEl = document.querySelector<HTMLElement>(`[data-guide-branches="${step.id}"]`);

      if (stepEl) stepEl.classList.remove('hidden');
      if (agentEl) agentEl.classList.remove('hidden');
      if (branchesEl) branchesEl.classList.remove('hidden');

      if (step.artifacts) {
        revealTreeFiles(i);
      }
    }

    // Restore opened branches
    if (Array.isArray(data.openedBranches)) {
      for (const key of data.openedBranches) {
        const btn = document.querySelector<HTMLElement>(`[data-guide-branch="${key}"]`);
        if (btn) btn.classList.add('hidden');
        const responseEl = document.querySelector<HTMLElement>(`[data-guide-branch-response="${key}"]`);
        if (responseEl) responseEl.classList.remove('hidden');
      }
    }

    // Show completion if past last step
    if (data.currentStepIndex >= GUIDE_STEPS.length) {
      showCompletion();
    } else {
      // Select last artifact if available
      const lastStep = GUIDE_STEPS[maxStep];
      if (lastStep.artifacts) {
        showArtifact(lastStep.artifacts[0].path);
      }
    }

    updatePhaseBar();
    updateContinueButton();
    scrollChatToBottom();
    return true;
  } catch {
    return false;
  }
}

function clearState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

export function initGuide() {
  messagesEl = document.getElementById('guide-messages')!;
  continueBtn = document.getElementById('guide-continue') as HTMLButtonElement;
  continueTxt = document.getElementById('guide-continue-text')!;
  inputArea = document.getElementById('guide-input-area')!;
  completeEl = document.getElementById('guide-complete')!;
  artifactPathEl = document.getElementById('guide-artifact-path')!;
  artifactContentEl = document.getElementById('guide-artifact-content')!;
  treeOverlay = document.getElementById('guide-tree-overlay')!;

  if (!messagesEl || !continueBtn) return;

  // Continue button — advance to next step
  continueBtn.addEventListener('click', () => {
    advanceToStep(state.currentStepIndex + 1);
  });

  // Branch buttons
  document.querySelectorAll<HTMLElement>('[data-guide-branch]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.guideBranch;
      if (!key) return;
      const [stepId, indexStr] = key.split('-');
      const branchIndex = parseInt(indexStr, 10);
      if (!isNaN(branchIndex)) showBranch(stepId, branchIndex);
    });
  });

  // File tree clicks
  document.querySelectorAll<HTMLElement>('[data-guide-file]').forEach(btn => {
    btn.addEventListener('click', () => {
      const path = btn.dataset.guideFile;
      if (!path || btn.dataset.guideFileType === 'directory') return;
      showArtifact(path);
      // Close mobile tree if open
      toggleMobileTree(false);
    });
  });

  // Phase bar clicks
  document.querySelectorAll<HTMLElement>('[data-guide-phase]').forEach(btn => {
    btn.addEventListener('click', () => {
      const phaseId = btn.dataset.guidePhase;
      if (phaseId) jumpToPhase(phaseId);
    });
  });

  // Mobile tree toggle
  document.getElementById('guide-tree-toggle')?.addEventListener('click', () => {
    toggleMobileTree(true);
  });
  document.getElementById('guide-tree-backdrop')?.addEventListener('click', () => {
    toggleMobileTree(false);
  });
  document.getElementById('guide-tree-close')?.addEventListener('click', () => {
    toggleMobileTree(false);
  });

  // Restart button
  document.getElementById('guide-restart')?.addEventListener('click', () => {
    clearState();
    window.location.reload();
  });

  // Restore saved state or start fresh
  if (!restoreState()) {
    advanceToStep(0);
  }
}
