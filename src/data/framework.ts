// Framework reference data — content not exported by @slope-dev/slope

export interface CliCommand {
  cmd: string;
  desc: string;
  category: 'lifecycle' | 'scoring' | 'analysis' | 'tooling' | 'planning';
}

export const CLI_COMMANDS: CliCommand[] = [
  // Lifecycle
  { cmd: 'init', desc: 'Initialize SLOPE in a project', category: 'lifecycle' },
  { cmd: 'briefing', desc: 'Pre-round briefing with hazard index', category: 'lifecycle' },
  { cmd: 'plan', desc: 'Create sprint plan from backlog', category: 'lifecycle' },
  { cmd: 'session', desc: 'Start/resume a scoring session', category: 'lifecycle' },
  { cmd: 'claim', desc: 'Claim a ticket for execution', category: 'lifecycle' },
  { cmd: 'next', desc: 'Get next recommended ticket', category: 'lifecycle' },
  { cmd: 'classify', desc: 'Classify shot from CI/PR signals', category: 'lifecycle' },
  { cmd: 'status', desc: 'Show current sprint status', category: 'lifecycle' },

  // Scoring
  { cmd: 'validate', desc: 'Validate scorecard JSON', category: 'scoring' },
  { cmd: 'review', desc: 'Generate sprint review markdown', category: 'scoring' },
  { cmd: 'card', desc: 'Compute handicap card', category: 'scoring' },
  { cmd: 'auto-card', desc: 'Build scorecards from git history', category: 'scoring' },
  { cmd: 'standup', desc: 'Generate standup from session data', category: 'scoring' },

  // Analysis
  { cmd: 'report', desc: 'Generate HTML performance report', category: 'analysis' },
  { cmd: 'dashboard', desc: 'Interactive HTML dashboard', category: 'analysis' },
  { cmd: 'tournament', desc: 'Multi-sprint tournament review', category: 'analysis' },
  { cmd: 'extract', desc: 'Extract events from sessions', category: 'analysis' },
  { cmd: 'distill', desc: 'Distill common issues from sprints', category: 'analysis' },
  { cmd: 'escalate', desc: 'Detect escalation triggers', category: 'analysis' },

  // Tooling
  { cmd: 'guard', desc: 'Manage guard framework', category: 'tooling' },
  { cmd: 'hook', desc: 'Install/remove hook integrations', category: 'tooling' },
  { cmd: 'map', desc: 'Generate/update codebase map', category: 'tooling' },
  { cmd: 'plugin', desc: 'Manage plugins', category: 'tooling' },
  { cmd: 'release', desc: 'Automate package releases', category: 'tooling' },
  { cmd: 'review-state', desc: 'Manage plan review state', category: 'tooling' },

  // Planning
  { cmd: 'roadmap', desc: 'Validate and review roadmaps', category: 'planning' },
  { cmd: 'flows', desc: 'Manage user-facing flow definitions', category: 'planning' },
];

export const CLI_CATEGORIES: Record<CliCommand['category'], string> = {
  lifecycle: 'Sprint Lifecycle',
  scoring: 'Scoring & Review',
  analysis: 'Analysis & Reporting',
  tooling: 'Tooling & Config',
  planning: 'Planning & Roadmap',
};

export interface StructureRow {
  golf: string;
  dev: string;
  scope: string;
  dataTerm?: string;
}

export const STRUCTURE_MAPPING: StructureRow[] = [
  { golf: 'Tournament', dev: 'Project', scope: 'The whole thing, all phases' },
  { golf: 'Round', dev: 'Phase', scope: 'Multi-sprint milestone (6 rounds total)' },
  { golf: 'Hole', dev: 'Sprint', scope: 'Self-contained, has a par', dataTerm: 'vocabulary.sprint' },
  { golf: 'Shot', dev: 'Ticket', scope: 'One deliberate action', dataTerm: 'vocabulary.ticket' },
  { golf: 'Stroke', dev: 'Commit', scope: 'The atomic unit of work' },
];

export interface HazardMeta {
  name: string;
  term: string;
  maps: string;
  penalty: string;
  color: string;
  bg: string;
  border: string;
}

export const HAZARD_METADATA: HazardMeta[] = [
  { name: 'Bunker', term: 'hazards.bunker', maps: 'Known gotcha', penalty: 'Recovery costs an extra shot but you\'re still in play. The gotcha was documented — you just didn\'t check the yardage book.', color: 'text-gold', bg: 'bg-gold/5', border: 'border-gold/15' },
  { name: 'Water', term: 'hazards.water', maps: 'Breaking change or data loss', penalty: 'Penalty stroke + re-tee from safe position. Irreversible damage — you need to revert and approach from a safer angle.', color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/15' },
  { name: 'OB (Out of Bounds)', term: 'hazards.ob', maps: 'Scope creep', penalty: 'Stroke + distance. You left the sprint boundary entirely. Go back to where you were and re-approach.', color: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/15' },
  { name: 'Rough', term: 'hazards.rough', maps: 'Technical debt', penalty: 'No penalty, just slower going. The code works but it\'s harder to navigate. Budget extra time.', color: 'text-text-secondary', bg: 'bg-bg-surface', border: 'border-border-subtle' },
  { name: 'Trees', term: 'hazards.trees', maps: 'Blocking dependency', penalty: 'Can\'t go direct. Must punch out sideways — unblock the dependency first, then approach the target.', color: 'text-emerald', bg: 'bg-emerald/5', border: 'border-emerald/15' },
];

export interface ConditionMeta {
  name: string;
  term: string;
  example: string;
}

export const CONDITION_METADATA: ConditionMeta[] = [
  { name: 'Wind', term: 'conditions.wind', example: 'Context compaction mid-sprint, token pressure' },
  { name: 'Rain', term: 'conditions.rain', example: 'Docker down, CI backed up, infra issues' },
  { name: 'Frost delay', term: 'conditions.frost_delay', example: 'Waiting on dependency, external blocker' },
  { name: 'Altitude', term: 'conditions.altitude', example: 'New environment (first deploy to X)' },
  { name: 'Pin position', term: 'conditions.pin_position', example: 'How tight the acceptance criteria are' },
];

export interface SpecialPlayMeta {
  name: string;
  term: string;
  meaning: string;
  detail: string;
}

export const SPECIAL_PLAY_METADATA: SpecialPlayMeta[] = [
  { name: 'Gimme', term: 'specialPlays.gimme', meaning: 'Trivial ticket, skip ceremony', detail: 'Obvious fix, no architect review needed' },
  { name: 'Mulligan', term: 'specialPlays.mulligan', meaning: 'Ticket revert and redo', detail: 'Approach was fundamentally wrong' },
  { name: 'Provisional', term: 'specialPlays.provisional', meaning: 'Fallback declared before swinging', detail: '"If this doesn\'t work in 2 shots, play X instead"' },
  { name: 'Lay-up', term: 'specialPlays.lay_up', meaning: 'Safer approach over ambitious one', detail: 'Could go for it but risk isn\'t worth it' },
  { name: 'Scramble', term: 'specialPlays.scramble', meaning: 'Multi-agent sprint', detail: 'Multiple agents take shots, use the best' },
  { name: 'Match play', term: 'specialPlays.match_play', meaning: 'Sprint-vs-sprint comparison', detail: 'Compare two sprints head to head' },
];

export interface SprintTypeMeta {
  type: string;
  description: string;
  whenToUse: string;
}

export const SPRINT_TYPE_METADATA: SprintTypeMeta[] = [
  { type: 'feature', description: 'New functionality — the standard sprint type', whenToUse: 'Building new features or user-facing changes' },
  { type: 'feedback', description: 'Refinement based on previous sprint learnings', whenToUse: 'When miss patterns suggest you need to adjust approach' },
  { type: 'infra', description: 'Infrastructure, CI/CD, deployment work', whenToUse: 'Setting up or maintaining build/deploy pipeline' },
  { type: 'bugfix', description: 'Dedicated bug-fixing sprint', whenToUse: 'Clearing a backlog of known issues' },
  { type: 'research', description: 'Investigation and prototyping', whenToUse: 'Exploring unfamiliar territory before committing to an approach' },
  { type: 'flow', description: 'Mapping user-facing workflows to code paths', whenToUse: 'Documenting and validating user journeys through the codebase' },
  { type: 'test-coverage', description: 'Increasing test coverage in weak areas', whenToUse: 'When GIR% or fairway% is low and you need safety nets' },
];

export interface EscalationTrigger {
  trigger: string;
  severity: string;
  action: string;
}

export const ESCALATION_TRIGGERS: EscalationTrigger[] = [
  { trigger: 'Score 3+ over par', severity: 'High', action: 'Flag for review, recommend training sprint' },
  { trigger: 'Consecutive bogeys (3+)', severity: 'Medium', action: 'Suggest simpler clubs, shorter shots' },
  { trigger: 'Hazard recurrence in same area', severity: 'High', action: 'Update common-issues, flag for architect review' },
  { trigger: 'Miss pattern lock-in', severity: 'Medium', action: 'Recommend targeted training type' },
  { trigger: 'Handicap regression (5-sprint window)', severity: 'Low', action: 'Surface in briefing, suggest practice sprint' },
];

export const SLOPE_FACTOR_DETAILS: Record<string, string> = {
  cross_package: 'Changes span multiple packages',
  schema_migration: 'Database migration required',
  new_area: 'First time touching this code area',
  external_dep: 'API, SDK, or service integration',
  concurrent_agents: 'Multi-agent coordination required',
};
