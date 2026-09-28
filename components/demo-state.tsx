/**
 * Estado local de la demostración de Cancún.
 * No importa el cliente de la base ni copia estos datos a una cuenta.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import {
  adjustmentResults,
  defaultDraft,
  defaultSetup,
  initialSubscriptions,
  type AccountName,
  type AdjustmentId,
  type MovementDraft,
  type SetupChoice,
  type SubscriptionItem,
} from '@/constants/demo';

type MovementEdit = {
  amount: string;
  note: string;
};

type GoalDraft = {
  name: string;
  total: string;
  saved: string;
  deadline: string;
  frequency: 'Semana' | 'Quincena' | 'Mes';
  partials: boolean;
};

type DemoValue = {
  displayName: string;
  setDisplayName: (value: string) => void;
  setupStatus: 'pending' | 'saved' | 'skipped';
  setup: SetupChoice;
  saveSetup: (value: SetupChoice) => void;
  skipSetup: () => void;
  draft: MovementDraft;
  setDraft: (patch: Partial<MovementDraft>) => void;
  savedMovement: MovementDraft | null;
  confirmMovement: () => void;
  updateSavedMovement: (patch: Partial<MovementDraft>) => void;
  clearSavedMovement: () => void;
  adjustment: AdjustmentId | null;
  confirmAdjustment: (choice: AdjustmentId) => void;
  contributionSaved: boolean;
  confirmContribution: () => void;
  hideAmounts: boolean;
  setHideAmounts: (value: boolean) => void;
  lastAccount: AccountName;
  subscriptions: SubscriptionItem[];
  addSubscription: (item: { name: string; amount: string; when: string }) => void;
  movementEdits: Record<string, MovementEdit>;
  editMovement: (id: string, patch: MovementEdit) => void;
  removedMovementIds: string[];
  removeMovement: (id: string) => void;
  goalDraft: GoalDraft;
  setGoalDraft: (patch: Partial<GoalDraft>) => void;
  goalRoute: ReturnType<typeof describeGoal>;
};

const defaultGoalDraft: GoalDraft = {
  name: 'Viaje a Cancún',
  total: '$30,000',
  saved: '$5,000',
  deadline: '30 de mayo de 2027',
  frequency: 'Quincena',
  partials: true,
};

function describeGoal(adjustment: AdjustmentId | null) {
  if (!adjustment) {
    return {
      status: 'Vas en ruta',
      nextAmount: '$1,250',
      nextDate: '15 de octubre',
      target: '$30,000',
      deadline: '30 de mayo de 2027',
    };
  }
  return adjustmentResults[adjustment];
}

const DemoContext = createContext<DemoValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayName] = useState('Sam');
  const [setupStatus, setSetupStatus] = useState<DemoValue['setupStatus']>('pending');
  const [setup, setSetup] = useState<SetupChoice>(defaultSetup);
  const [draft, setDraftState] = useState<MovementDraft>(defaultDraft);
  const [savedMovement, setSavedMovement] = useState<MovementDraft | null>(null);
  const [adjustment, setAdjustment] = useState<AdjustmentId | null>(null);
  const [contributionSaved, setContributionSaved] = useState(false);
  const [hideAmounts, setHideAmounts] = useState(false);
  const [lastAccount, setLastAccount] = useState<AccountName>('Débito');
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(initialSubscriptions);
  const [movementEdits, setMovementEdits] = useState<Record<string, MovementEdit>>({});
  const [removedMovementIds, setRemovedMovementIds] = useState<string[]>([]);
  const [goalDraft, setGoalDraftState] = useState<GoalDraft>(defaultGoalDraft);

  const value = useMemo<DemoValue>(
    () => ({
      displayName,
      setDisplayName,
      setupStatus,
      setup,
      saveSetup: (next) => {
        setSetup(next);
        setSetupStatus('saved');
      },
      skipSetup: () => setSetupStatus('skipped'),
      draft,
      setDraft: (patch) => setDraftState((current) => ({ ...current, ...patch })),
      savedMovement,
      confirmMovement: () => {
        setSavedMovement(draft);
        setLastAccount(draft.account);
      },
      updateSavedMovement: (patch) => {
        setSavedMovement((current) => (current ? { ...current, ...patch } : current));
      },
      clearSavedMovement: () => setSavedMovement(null),
      adjustment,
      confirmAdjustment: (choice) => setAdjustment(choice),
      contributionSaved,
      confirmContribution: () => setContributionSaved(true),
      hideAmounts,
      setHideAmounts,
      lastAccount,
      subscriptions,
      addSubscription: (item) =>
        setSubscriptions((current) => [
          ...current,
          {
            id: `extra-${current.length + 1}`,
            name: item.name,
            amount: item.amount,
            when: item.when,
            icon: 'repeat',
          },
        ]),
      movementEdits,
      editMovement: (id, patch) => setMovementEdits((current) => ({ ...current, [id]: patch })),
      removedMovementIds,
      removeMovement: (id) => setRemovedMovementIds((current) => (current.includes(id) ? current : [...current, id])),
      goalDraft,
      setGoalDraft: (patch) => setGoalDraftState((current) => ({ ...current, ...patch })),
      goalRoute: describeGoal(adjustment),
    }),
    [
      adjustment,
      contributionSaved,
      displayName,
      draft,
      goalDraft,
      hideAmounts,
      lastAccount,
      movementEdits,
      removedMovementIds,
      savedMovement,
      setup,
      setupStatus,
      subscriptions,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) {
    throw new Error('useDemo debe usarse dentro de DemoProvider');
  }
  return value;
}
