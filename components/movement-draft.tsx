import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { formatIsoDate, todayInTimeZone } from '@/src/dates';
import type { MovementInput } from '@/src/movements/validation';

type DraftValue = {
  draft: MovementInput;
  revision: number;
  replaceDraft: (next: MovementInput) => void;
  resetDraft: () => void;
};

const MovementDraftContext = createContext<DraftValue | null>(null);

function emptyDraft(): MovementInput {
  return {
    kind: 'gasto',
    amount: '',
    categoryId: '',
    accountId: '',
    date: formatIsoDate(todayInTimeZone()),
    note: '',
  };
}

export function MovementDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<MovementInput>(emptyDraft);
  const [revision, setRevision] = useState(0);
  const value = useMemo<DraftValue>(
    () => ({
      draft,
      revision,
      replaceDraft: (next) => setDraft(next),
      resetDraft: () => {
        setDraft(emptyDraft());
        setRevision((current) => current + 1);
      },
    }),
    [draft, revision],
  );
  return <MovementDraftContext.Provider value={value}>{children}</MovementDraftContext.Provider>;
}

export function useMovementDraft(): DraftValue {
  const value = useContext(MovementDraftContext);
  if (!value) {
    throw new Error('useMovementDraft debe usarse dentro de MovementDraftProvider');
  }
  return value;
}
