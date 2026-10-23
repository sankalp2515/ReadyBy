export type Task = {
  id: string;
  title: string;
  duration: number;
  owner: string;
  deps: string[];
  required: boolean;
  release: number;
  status: string;
  barrier?: boolean;
  completedAt?: number;
  actualStart?: number;
  remaining?: number;
  startedAt?: number;
};
export type Person = { id: string; name: string; available: number[][] };
export type Slot = {
  taskId: string;
  personId: string;
  start: number;
  end: number;
  completed?: boolean;
  active?: boolean;
};
export type Option = {
  id: string;
  kind: string;
  deferred: string[];
  deadline: number;
  finish: number;
  validUntil: number;
  schedule: Slot[];
};
export type Mission = {
  id: string;
  revision: number;
  title: string;
  phase: string;
  isDemo: boolean;
  demoChapter?: string;
  pendingClarification?: {
    taskId: string;
    question: string;
    expiresAt: number;
    revision: number;
  } | null;
  goalKind?: string;
  clock: { mode: string; now: number; timezone: string };
  start: number;
  now: number;
  deadline: number;
  people: Person[];
  tasks: Task[];
  analysis: {
    full: {
      status: string;
      finish?: number;
      schedule?: Slot[];
      verification?: {
        valid: boolean;
        onTime: boolean;
        violations?: unknown[];
      };
      optimizationComplete: boolean;
      visited: number;
    };
    alternatives: unknown[];
  };
  proposal: { options: Option[] } | null;
  summary: string;
  messages: { role: string; text: string }[];
  receipts: Record<string, unknown>[];
  events: { id: string; at: number; kind: string; text: string }[];
  nextActions: {
    person: Person;
    task: Task | null;
    ready: boolean;
    remaining: number;
  }[];
};
export type Template = {
  id: string;
  name: string;
  description: string;
  minutes: number;
  taskCount: number;
};
export type Bootstrap = {
  identity: {
    displayName: string;
    username: string;
    role: string;
    guest: boolean;
  } | null;
  csrfToken?: string;
  recoveryCode?: string;
  household?: {
    id: string;
    name: string;
    people: string[];
    activeMissionId: string | null;
  };
  missions?: {
    id: string;
    title: string;
    phase: string;
    isDemo: boolean;
    archived: boolean;
    completed: number;
    total: number;
  }[];
  routines?: { id: string; name: string; minutes: number; taskSpecs: Task[] }[];
  templates: Template[];
};
