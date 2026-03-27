// Guide tour data — defines the 6-step walkthrough, artifacts, and branches.

export type GuidePhase = 'init' | 'plan' | 'build' | 'review' | 'reflect';

export interface GuideArtifact {
  path: string;
  content: string;
  language: 'json' | 'yaml' | 'markdown' | 'text';
  action: 'create' | 'update';
}

export interface GuideBranch {
  label: string;
  response: string;
  artifacts?: GuideArtifact[];
}

export interface GuideStep {
  id: string;
  phase: GuidePhase;
  userPrompt: string;
  agentResponse: string;
  artifacts?: GuideArtifact[];
  branches?: GuideBranch[];
  docsRef?: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  addedAtStep: number;
}

export const GUIDE_PHASES: { id: GuidePhase; label: string }[] = [
  { id: 'init', label: 'Init' },
  { id: 'plan', label: 'Plan' },
  { id: 'build', label: 'Build' },
  { id: 'review', label: 'Review' },
  { id: 'reflect', label: 'Reflect' },
];

// ---------------------------------------------------------------------------
// Artifact content — based on real SLOPE output
// ---------------------------------------------------------------------------

const CONFIG_JSON = `{
  "scorecardDir": "docs/retros",
  "scorecardPattern": "sprint-*.json",
  "minSprint": 1,
  "commonIssuesPath": ".slope/common-issues.json",
  "claimsPath": ".slope/claims.json",
  "roadmapPath": "docs/backlog/roadmap.json",
  "metaphor": "golf",
  "detectedStack": {
    "language": "TypeScript",
    "frameworks": ["vitest"],
    "packageManager": "npm",
    "runtime": "Node 22"
  },
  "slopeVersion": "1.38.0"
}`;

const COMMON_ISSUES_JSON = `{
  "recurring_patterns": []
}`;

const CLAIMS_JSON = `{
  "sprint": 1,
  "claims": [
    {
      "key": "S1-1",
      "title": "Set up project scaffolding",
      "club": "short_iron",
      "status": "claimed"
    },
    {
      "key": "S1-2",
      "title": "Add user authentication",
      "club": "long_iron",
      "status": "claimed"
    },
    {
      "key": "S1-3",
      "title": "Write integration tests",
      "club": "wedge",
      "status": "claimed"
    }
  ]
}`;

const BRIEFING_OUTPUT = `SLOPE PRE-ROUND BRIEFING — S1
════════════════════════════════════════════════

Handicap: scratch (no scorecards yet)
Stack: TypeScript / vitest / npm / Node 22

CLAIMED TICKETS
─────────────────────────────────────
  S1-1  Set up project scaffolding     (short_iron)
  S1-2  Add user authentication        (long_iron)
  S1-3  Write integration tests        (wedge)

Par: 3  |  Slope: 0

RECURRING HAZARDS
─────────────────────────────────────
  No common issues recorded yet.
  After this sprint, hazards you encounter will be
  tracked here so your agent can warn you next time.

TRAINING NOTES
─────────────────────────────────────
  First sprint — focus on establishing your baseline.
  Your handicap card will populate after this round.`;

const GUARD_OUTPUT = `⚠️  SCOPE DRIFT — You modified src/auth/session.ts
but your claim only covers S1-1 (project scaffolding).

Run \`slope claim add\` to expand scope, or note this
as an unplanned change in your review.`;

const SCORECARD_JSON = `{
  "sprint_number": 1,
  "theme": "Getting Started",
  "par": 3,
  "slope": 0,
  "score": 3,
  "score_label": "par",
  "date": "2026-03-25",
  "shots": [
    {
      "ticket_key": "S1-1",
      "title": "Set up project scaffolding",
      "club": "short_iron",
      "result": "green",
      "hazards": [],
      "notes": "Clean setup, no issues"
    },
    {
      "ticket_key": "S1-2",
      "title": "Add user authentication",
      "club": "long_iron",
      "result": "fairway",
      "hazards": [
        {
          "type": "rough",
          "description": "Session token format mismatch between auth provider and local store"
        }
      ],
      "notes": "Hit rough on token handling but recovered"
    },
    {
      "ticket_key": "S1-3",
      "title": "Write integration tests",
      "club": "wedge",
      "result": "in_the_hole",
      "hazards": [],
      "notes": "Tests written and passing"
    }
  ],
  "hole_stats": {
    "fairways_hit": 3,
    "total_fairways": 3,
    "greens_in_regulation": 3,
    "total_greens": 3,
    "putts": 0,
    "penalties": 0,
    "hazard_penalties": 0
  }
}`;

const HANDICAP_CARD = `SLOPE Handicap Card (1 scorecard)
═══════════════════════════════════════════
Stat                All-time
─────────────────────────────────────
Handicap               0.0
Fairways             100%
GIR                  100%
Putts                  0
Hazards                1

Miss Pattern: none yet

Common Issues Updated:
  + "Session token format mismatch" added
    (category: types, from S1-2)`;

const TREND_CARD = `SLOPE Handicap Card (5 scorecards)
═══════════════════════════════════════════
Stat              Last 5     All-time
─────────────────────────────────────
Handicap            0.2         0.2
Fairways          93.3%       93.3%
GIR               86.7%       86.7%
Putts               0.2         0.2
Hazards             1.0         1.0

Recent Sprints:
  S5  The Pipeline       par   (3/3)
  S4  Search & Filters   par   (4/4)
  S3  Data Models        eagle (3/5)  ★
  S2  Auth Hardening     par   (3/3)
  S1  Getting Started    par   (3/3)

Common Issues: 4 patterns tracked
  #1  Token format assumptions (S1, S2)
  #2  Missing index on polymorphic queries (S4)

Trend: ↓ Handicap improving (0.4 → 0.2)`;

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

export const GUIDE_STEPS: GuideStep[] = [
  // Step 1: Init
  {
    id: 'init',
    phase: 'init',
    userPrompt: 'Set up SLOPE in my project',
    agentResponse:
      `Running \`slope init\`... I've detected your stack and created the \`.slope/\` directory.\n\n` +
      `Here's what happened:\n` +
      `- **Detected** your language (TypeScript), test framework (vitest), package manager (npm)\n` +
      `- **Created** \`.slope/config.json\` with your project settings\n` +
      `- **Created** \`.slope/common-issues.json\` to track recurring hazards\n` +
      `- **Created** \`.slope/claims.json\` to track ticket ownership per sprint\n\n` +
      `Your scorecards will go in \`docs/retros/\` — each sprint gets a JSON file with structured metrics.\n\n` +
      `The default metaphor is **golf** — sprints are "holes", tickets are "shots", bugs are "hazards". You can switch to agile, tennis, baseball, gaming, D&D, or matrix vocabulary anytime.`,
    artifacts: [
      { path: '.slope/config.json', content: CONFIG_JSON, language: 'json', action: 'create' },
      { path: '.slope/common-issues.json', content: COMMON_ISSUES_JSON, language: 'json', action: 'create' },
      { path: '.slope/claims.json', content: CLAIMS_JSON, language: 'json', action: 'create' },
    ],
    branches: [
      {
        label: 'What does each config field do?',
        response:
          `Here's the breakdown:\n\n` +
          `- **scorecardDir** / **scorecardPattern** — where sprint review JSON files are stored and how to find them\n` +
          `- **commonIssuesPath** — a database of recurring hazards your agent has hit before. When your agent encounters a pattern it's seen before, it warns you before you repeat the mistake.\n` +
          `- **claimsPath** — tracks which tickets are claimed in the current sprint, so scope-drift guards can warn if you edit files outside your plan\n` +
          `- **roadmapPath** — your sprint backlog and phase structure\n` +
          `- **metaphor** — vocabulary layer (golf by default). Changes labels but not the underlying scoring math.\n` +
          `- **detectedStack** — auto-detected from your repo. Used by the briefing to provide stack-specific guidance.`,
      },
    ],
    docsRef: '#installation',
  },

  // Step 2: Briefing
  {
    id: 'briefing',
    phase: 'plan',
    userPrompt: 'What should I work on?',
    agentResponse:
      `Running \`slope briefing\`...\n\n` +
      `\`\`\`\n${BRIEFING_OUTPUT}\n\`\`\`\n\n` +
      `Since this is Sprint 1, your handicap is **scratch** (no history yet). After this sprint, you'll have a baseline.\n\n` +
      `The briefing pulls from three sources:\n` +
      `- **Your claimed tickets** — what you planned to deliver\n` +
      `- **Your common issues database** — recurring hazards from past sprints (empty for now)\n` +
      `- **Your handicap card** — rolling performance metrics that reveal trends\n\n` +
      `Your agent reads this briefing before starting work. It's like a pre-round warmup — your agent knows the par, the risks, and what to watch for.`,
    docsRef: '#briefing',
  },

  // Step 3: Build (guard fires)
  {
    id: 'build',
    phase: 'build',
    userPrompt: "I'll take the first ticket — set up the project scaffolding",
    agentResponse:
      `Working on S1-1... I've set up the scaffolding and I'm moving on to the auth module.\n\n` +
      `**A guard just fired:**\n\n` +
      `\`\`\`\n${GUARD_OUTPUT}\n\`\`\`\n\n` +
      `This is the **scope-drift guard** — one of 29 guards that run in the background. It noticed I started editing auth files while my claim only covers scaffolding.\n\n` +
      `Guards don't block your work by default — they inject context and warnings so your agent stays on track. Some guards are **mechanical** (they block actions like committing without tests) and some are **advisory** (suggestions your agent can choose to follow).`,
    artifacts: [
      { path: '.slope/guard-state/scope-drift.json', content: `{\n  "lastFired": "2026-03-25T10:15:00Z",\n  "reason": "S1-1 claim does not cover src/auth/session.ts",\n  "action": "advisory"\n}`, language: 'json', action: 'create' },
    ],
    branches: [
      {
        label: 'What are guards?',
        response:
          `Guards are real-time checks that run during your coding session. There are **29 guards** in SLOPE, organized by when they fire:\n\n` +
          `- **Pre-commit**: Check for missing tests, lint errors, scope drift\n` +
          `- **Post-edit**: Watch for patterns you've been burned by before\n` +
          `- **On stop**: Ensure you don't leave uncommitted work or unpushed commits\n` +
          `- **Workflow gates**: Block actions until prerequisites are met (e.g., can't close a sprint without a review)\n\n` +
          `Each guard can be **mechanical** (blocks the action) or **advisory** (injects context but doesn't block). Over time, advisory guards that consistently catch real issues can be promoted to mechanical.\n\n` +
          `Your agent sees guard output as context injections — it's like having a caddy who whispers "you sliced left the last three times on this hole."`,
      },
    ],
    docsRef: '#guards',
  },

  // Step 4: Review
  {
    id: 'review',
    phase: 'review',
    userPrompt: "Done — how'd I do?",
    agentResponse:
      `Running \`slope review\`... Here's your Sprint 1 scorecard.\n\n` +
      `**Score: Par (3/3)** — You delivered all 3 tickets at the planned complexity.\n\n` +
      `Shot-by-shot breakdown:\n` +
      `- **S1-1** (scaffolding): 🟢 Green — clean delivery\n` +
      `- **S1-2** (auth): 🟡 Fairway — delivered but hit **rough** on token format mismatch\n` +
      `- **S1-3** (tests): ⭐ In the hole — delivered ahead of expectations\n\n` +
      `The token format issue from S1-2 has been added to your **common issues database**. Next time your agent encounters token handling, it'll flag this pattern before you start.`,
    artifacts: [
      { path: 'docs/retros/sprint-1.json', content: SCORECARD_JSON, language: 'json', action: 'create' },
    ],
    docsRef: '#scoring',
  },

  // Step 5: Handicap card
  {
    id: 'card',
    phase: 'reflect',
    userPrompt: "What's my overall performance?",
    agentResponse:
      `Running \`slope card\`... Here's your handicap card after Sprint 1.\n\n` +
      `\`\`\`\n${HANDICAP_CARD}\n\`\`\`\n\n` +
      `With just one scorecard, the numbers are simple — 100% fairways, 100% GIR, one hazard. The real value comes over time as patterns emerge.\n\n` +
      `The **handicap** is a rolling performance index (lower is better). It factors in estimation accuracy (did you hit par?), delivery accuracy (did tickets land as planned?), and hazard frequency.`,
    branches: [
      {
        label: 'How is handicap calculated?',
        response:
          `The handicap formula looks at your last N sprints (configurable windows of 5, 10, and all-time):\n\n` +
          `**Inputs:**\n` +
          `- **Fairway %** — how often your scoping was on target (tickets delivered as planned)\n` +
          `- **GIR %** — how often your estimation was accurate (score ≤ par)\n` +
          `- **Putts** — rework or revision cycles after "landing on the green"\n` +
          `- **Penalties** — serious hazards (breaking changes, scope creep, data loss)\n\n` +
          `A handicap of **0.0** means you're consistently delivering at or under par. As it rises, it tells you where the drift is coming from — the miss pattern (long/short/left/right) maps to over-engineering, under-scoping, dependency blocks, and tech debt.`,
      },
    ],
    docsRef: '#handicap',
  },

  // Step 6: Trends
  {
    id: 'trends',
    phase: 'reflect',
    userPrompt: 'Show me how this compounds over time',
    agentResponse:
      `Fast-forward five sprints. Here's what your handicap card looks like now:\n\n` +
      `\`\`\`\n${TREND_CARD}\n\`\`\`\n\n` +
      `Notice what happened:\n` +
      `- Your handicap dropped from scratch to **0.2** — consistent par-or-better delivery\n` +
      `- Sprint 3 was an **eagle** — you delivered a 5-par sprint in 3 shots\n` +
      `- The common issues database now tracks **4 patterns**. Your agent flags these before you start each sprint, so you don't repeat mistakes.\n\n` +
      `This is the core loop: **score → review → learn → improve**. Every sprint makes the next one better because your agent carries forward what it learned.\n\n` +
      `Ready to try it? Install SLOPE with \`npx @slope-dev/slope init\` and run your first sprint.`,
    docsRef: '#getting-started',
  },
];

// ---------------------------------------------------------------------------
// File tree builder
// ---------------------------------------------------------------------------

export function buildFileTree(throughStepIndex: number): FileTreeNode[] {
  const pathMap = new Map<string, { stepIndex: number; isFile: boolean }>();

  for (let i = 0; i <= throughStepIndex && i < GUIDE_STEPS.length; i++) {
    const step = GUIDE_STEPS[i];
    if (!step.artifacts) continue;
    for (const artifact of step.artifacts) {
      // Register the file itself
      pathMap.set(artifact.path, { stepIndex: i, isFile: true });
      // Register all parent directories
      const parts = artifact.path.split('/');
      for (let j = 1; j < parts.length; j++) {
        const dirPath = parts.slice(0, j).join('/');
        if (!pathMap.has(dirPath)) {
          pathMap.set(dirPath, { stepIndex: i, isFile: false });
        }
      }
    }
    // Also process branch artifacts
    if (step.branches) {
      for (const branch of step.branches) {
        if (!branch.artifacts) continue;
        for (const artifact of branch.artifacts) {
          pathMap.set(artifact.path, { stepIndex: i, isFile: true });
          const parts = artifact.path.split('/');
          for (let j = 1; j < parts.length; j++) {
            const dirPath = parts.slice(0, j).join('/');
            if (!pathMap.has(dirPath)) {
              pathMap.set(dirPath, { stepIndex: i, isFile: false });
            }
          }
        }
      }
    }
  }

  // Build nested tree from flat path map
  const root: FileTreeNode[] = [];

  const sorted = [...pathMap.entries()].sort(([a], [b]) => a.localeCompare(b));

  for (const [path, info] of sorted) {
    const parts = path.split('/');
    if (parts.length === 1) {
      // Top-level entry
      root.push({
        name: parts[0],
        path,
        type: info.isFile ? 'file' : 'directory',
        children: info.isFile ? undefined : [],
        addedAtStep: info.stepIndex,
      });
    } else {
      // Find parent directory node
      let parent = root;
      for (let i = 0; i < parts.length - 1; i++) {
        const dirPath = parts.slice(0, i + 1).join('/');
        const dirNode = parent.find(n => n.path === dirPath);
        if (dirNode && dirNode.children) {
          parent = dirNode.children;
        }
      }
      parent.push({
        name: parts[parts.length - 1],
        path,
        type: info.isFile ? 'file' : 'directory',
        children: info.isFile ? undefined : [],
        addedAtStep: info.stepIndex,
      });
    }
  }

  return root;
}

// ---------------------------------------------------------------------------
// Artifact content lookup
// ---------------------------------------------------------------------------

export function getArtifactContent(path: string): string | null {
  for (const step of GUIDE_STEPS) {
    if (step.artifacts) {
      const found = step.artifacts.find(a => a.path === path);
      if (found) return found.content;
    }
    if (step.branches) {
      for (const branch of step.branches) {
        if (branch.artifacts) {
          const found = branch.artifacts.find(a => a.path === path);
          if (found) return found.content;
        }
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Lightweight inline text → HTML formatter (build-time)
// ---------------------------------------------------------------------------

export function formatAgentResponse(text: string): string {
  return text
    // Code blocks: ```...\n...\n```
    .replace(/```\n([\s\S]*?)```/g, (_m, code) =>
      `<pre class="my-3 p-3 rounded-lg bg-bg-primary border border-border-subtle font-mono text-xs leading-relaxed text-text-secondary overflow-x-auto whitespace-pre">${escapeHtml(code.trimEnd())}</pre>`)
    // Inline code: `...`
    .replace(/`([^`]+)`/g, '<code class="text-emerald bg-bg-primary px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    // Bold: **...**
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-text-primary font-semibold">$1</strong>')
    // Paragraphs: double newline
    .replace(/\n\n/g, '</p><p class="mt-3">')
    // Line breaks within paragraphs
    .replace(/\n/g, '<br>')
    // Wrap in paragraph
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
