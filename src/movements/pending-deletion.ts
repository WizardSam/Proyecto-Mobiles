export const UNDO_WINDOW_MS = 5000;

type Commit = (id: string) => Promise<void>;

export type PendingDeletionSnapshot = {
  id: string | null;
  error: string | null;
  undoable: boolean;
  settled: number;
};

let pendingId: string | null = null;
let undoable = false;
let settled = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let errorMessage: string | null = null;
let snapshot: PendingDeletionSnapshot = { id: null, error: null, undoable: false, settled: 0 };
const listeners = new Set<() => void>();

function publish(): void {
  snapshot = { id: pendingId, error: errorMessage, undoable, settled };
  for (const listener of listeners) {
    listener();
  }
}

function clearTimer(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

async function runCommit(id: string, commit: Commit): Promise<void> {
  try {
    await commit(id);
    errorMessage = null;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'No se pudo eliminar el movimiento.';
  }
  if (pendingId === id) {
    pendingId = null;
    undoable = false;
  }
  settled += 1;
  publish();
}

export function subscribePendingDeletion(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPendingDeletionSnapshot(): PendingDeletionSnapshot {
  return snapshot;
}

export function startPendingDeletion(id: string, commit: Commit): void {
  if (pendingId && pendingId !== id && undoable) {
    const previous = pendingId;
    clearTimer();
    undoable = false;
    pendingId = null;
    void runCommit(previous, commit);
  }
  if (pendingId === id) {
    return;
  }
  errorMessage = null;
  undoable = true;
  pendingId = id;
  timer = setTimeout(() => {
    if (pendingId !== id || !undoable) {
      return;
    }
    undoable = false;
    timer = null;
    publish();
    void runCommit(id, commit);
  }, UNDO_WINDOW_MS);
  publish();
}

export function undoPendingDeletion(): void {
  if (!pendingId || !undoable) {
    return;
  }
  clearTimer();
  pendingId = null;
  undoable = false;
  errorMessage = null;
  publish();
}

export function flushPendingDeletion(commit: Commit): void {
  if (!pendingId || !undoable) {
    return;
  }
  const id = pendingId;
  clearTimer();
  undoable = false;
  publish();
  void runCommit(id, commit);
}
