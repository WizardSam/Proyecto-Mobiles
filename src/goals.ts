import {
  addDays,
  allocateCentsToDates,
  civilDate,
  compareCivilDates,
  contributionDates,
  DateError,
  formatIsoDate,
  type CivilDate,
  type ContributionFrequency,
} from './dates';
import { addCents, compareCents, subtractCents, toCents, type Cents } from './money';

export type Milestone = {
  readonly id: string;
  readonly name: string;
  readonly planned: Cents;
  readonly due: CivilDate;
};

export type MilestoneView = Milestone & {
  readonly used: Cents;
  readonly pending: Cents;
};

export type RecordedContribution = {
  readonly id: string;
  readonly amount: Cents;
  readonly occurredOn: CivilDate;
};

export type ImmediateContribution = {
  readonly id: string;
  readonly amount: Cents;
  readonly occurredOn: CivilDate;
  readonly disbursementId: string;
};

export type GoalDisbursement = {
  readonly id: string;
  readonly milestoneId: string;
  readonly amount: Cents;
  readonly occurredOn: CivilDate;
};

export type ScheduledContribution = {
  readonly date: CivilDate;
  readonly amount: Cents;
  readonly milestoneId: string | null;
};

export type CalendarEntry =
  | { readonly kind: 'aportacion'; readonly date: CivilDate; readonly amount: Cents; readonly milestoneId: string | null }
  | { readonly kind: 'hito'; readonly milestoneId: string; readonly name: string; readonly date: CivilDate; readonly pending: Cents };

export type GoalState = {
  readonly reserve: Cents;
  readonly utilized: Cents;
  readonly progress: Cents;
  readonly pending: Cents;
};

export type GoalVersion = {
  readonly version: number;
  readonly target: Cents;
  readonly openingSavings: Cents;
  readonly frequency: ContributionFrequency;
  readonly from: CivilDate;
  readonly deadline: CivilDate;
  readonly milestones: readonly Milestone[];
  readonly contributions: readonly RecordedContribution[];
  readonly immediateContributions: readonly ImmediateContribution[];
  readonly disbursements: readonly GoalDisbursement[];
  readonly omittedDates: readonly CivilDate[];
  readonly schedule: readonly ScheduledContribution[];
  readonly calendar: readonly CalendarEntry[];
  readonly feasible: boolean;
  readonly reason: string | null;
  readonly state: GoalState;
};

export type Goal = GoalVersion & {
  readonly id: string;
  readonly name: string;
  readonly history: readonly GoalVersion[];
};

export type MilestoneResolution = 'aumentar-hito' | 'separar-excedente';

export type CoveragePreview = {
  readonly linkedAmount: Cents;
  readonly ordinaryExpense: Cents;
  readonly coveredByReserve: Cents;
  readonly immediateContribution: Cents;
  readonly projectedAvailable: Cents;
  readonly warning: string | null;
  readonly requiresAvailableAuthorization: boolean;
};

export type DisbursementSimulation = {
  readonly amount: Cents;
  readonly reserve: Cents;
  readonly milestonePending: Cents;
  readonly requiresResolution: boolean;
  readonly increaseMilestone: CoveragePreview;
  readonly splitExcess: CoveragePreview;
};

export type DisbursementConfirmation = {
  readonly goal: Goal;
  readonly ordinaryExpense: Cents;
  readonly warning: string | null;
  readonly immediateContribution: Cents;
  readonly balanceDelta: Cents;
  readonly reserveDelta: Cents;
  readonly availableDelta: Cents;
  readonly projectedAvailable: Cents;
};

export type AdjustmentKind = 'aumentar' | 'mover' | 'reducir';

export type AdjustmentSimulation = {
  readonly kind: AdjustmentKind;
  readonly feasible: boolean;
  readonly reason: string | null;
  readonly target: Cents;
  readonly deadline: CivilDate;
  readonly schedule: readonly ScheduledContribution[];
  readonly preservedContribution: Cents;
};

export type GoalErrorCode = 'invalid' | 'range' | 'duplicate' | 'not-found' | 'authorization' | 'resolution';

export class GoalError extends Error {
  readonly code: GoalErrorCode;

  constructor(code: GoalErrorCode, message: string) {
    super(message);
    this.name = 'GoalError';
    this.code = code;
  }
}

const NEGATIVE_AVAILABLE_WARNING = 'El disponible proyectado queda negativo.';

export function createGoal(input: {
  id: string;
  name: string;
  target: Cents;
  openingSavings: Cents;
  frequency: ContributionFrequency;
  from: CivilDate;
  deadline: CivilDate;
  milestones?: readonly Milestone[];
}): Goal {
  const draft = {
    id: requiredId(input.id, 'La meta necesita un identificador.'),
    name: requiredName(input.name),
    version: 1,
    history: [] as GoalVersion[],
    target: nonNegative(input.target, 'El objetivo no puede ser negativo.'),
    openingSavings: nonNegative(input.openingSavings, 'El ahorro inicial no puede ser negativo.'),
    frequency: copyFrequency(input.frequency),
    from: validateDate(input.from),
    deadline: validateDate(input.deadline),
    milestones: normalizeMilestones(input.milestones ?? [], input.target),
    contributions: [] as RecordedContribution[],
    immediateContributions: [] as ImmediateContribution[],
    disbursements: [] as GoalDisbursement[],
    omittedDates: [] as CivilDate[],
  };
  ensureDeadlineOrder(draft.from, draft.deadline);
  return assemble(draft);
}

export function confirmContribution(
  goal: Goal,
  input: { id: string; amount: Cents; occurredOn: CivilDate },
): Goal {
  const current = validateGoal(goal);
  const occurredOn = validateDate(input.occurredOn);
  const amount = positive(input.amount, 'La aportación debe ser mayor que cero.');
  const id = uniqueId(input.id, current, 'La aportación necesita un identificador.');
  const omittedDates = isScheduled(current, occurredOn)
    ? [...current.omittedDates, occurredOn]
    : current.omittedDates;
  return nextVersion(current, {
    contributions: [...current.contributions, { id, amount, occurredOn }],
    omittedDates,
  });
}

export function simulateSkip(goal: Goal, occurredOn: CivilDate): AdjustmentSimulation {
  return simulateIncreaseContributions(goal, { omitDate: occurredOn });
}

export function confirmSkip(goal: Goal, occurredOn: CivilDate): Goal {
  const current = validateGoal(goal);
  requireScheduled(current, occurredOn);
  return nextVersion(current, { omittedDates: [...current.omittedDates, validateDate(occurredOn)] });
}

export function simulateIncreaseContributions(goal: Goal, options?: { omitDate?: CivilDate }): AdjustmentSimulation {
  const current = validateGoal(goal);
  const omittedDates = omittedWith(current, options?.omitDate);
  const built = buildPlan({ ...current, omittedDates });
  return {
    kind: 'aumentar',
    feasible: built.feasible,
    reason: built.reason,
    target: current.target,
    deadline: current.deadline,
    schedule: built.schedule,
    preservedContribution: preservedAmount(current, options?.omitDate),
  };
}

export function simulateMoveDeadline(goal: Goal, options?: { omitDate?: CivilDate }): AdjustmentSimulation {
  const current = validateGoal(goal);
  const omittedDates = omittedWith(current, options?.omitDate);
  const preserved = preservedAmount(current, options?.omitDate);
  const needed = datesNeeded(current.state.pending, preserved);
  if (needed === 0) {
    return {
      kind: 'mover',
      feasible: current.feasible,
      reason: current.reason,
      target: current.target,
      deadline: current.deadline,
      schedule: current.schedule,
      preservedContribution: preserved,
    };
  }
  const deadline =
    needed === null
      ? null
      : earliestDeadline(current.from, current.frequency, needed, dateSet(omittedDates), current.deadline);
  if (!deadline) {
    return {
      kind: 'mover',
      feasible: false,
      reason: 'No hay una fecha compatible con la frecuencia que conserve la aportación anterior.',
      target: current.target,
      deadline: current.deadline,
      schedule: [],
      preservedContribution: preserved,
    };
  }
  const built = buildPlan({ ...current, deadline, omittedDates });
  return {
    kind: 'mover',
    feasible: built.feasible,
    reason: built.reason,
    target: current.target,
    deadline,
    schedule: built.schedule,
    preservedContribution: preserved,
  };
}

export function simulateReduceTarget(goal: Goal, options?: { omitDate?: CivilDate }): AdjustmentSimulation {
  const current = validateGoal(goal);
  const omittedDates = omittedWith(current, options?.omitDate);
  const preserved = preservedAmount(current, options?.omitDate);
  const dates = availableDates({ ...current, omittedDates });
  const achievable = addCents(progressOf(current), multiply(preserved, dates.length));
  if (compareCents(achievable, sumMilestones(current.milestones)) < 0) {
    return {
      kind: 'reducir',
      feasible: false,
      reason: 'Mantener la aportación y la fecha dejaría el objetivo por debajo de la suma de los hitos.',
      target: current.target,
      deadline: current.deadline,
      schedule: [],
      preservedContribution: preserved,
    };
  }
  const built = buildPlan({ ...current, target: achievable, omittedDates });
  return {
    kind: 'reducir',
    feasible: built.feasible,
    reason: built.reason,
    target: achievable,
    deadline: current.deadline,
    schedule: built.schedule,
    preservedContribution: preserved,
  };
}

export function confirmAdjustment(
  goal: Goal,
  input: { kind: AdjustmentKind; omitDate?: CivilDate },
): Goal {
  const current = validateGoal(goal);
  if (input.kind !== 'aumentar' && input.kind !== 'mover' && input.kind !== 'reducir') {
    throw new GoalError('invalid', 'El tipo de reajuste no es válido.');
  }
  const simulation =
    input.kind === 'aumentar'
      ? simulateIncreaseContributions(current, { omitDate: input.omitDate })
      : input.kind === 'mover'
        ? simulateMoveDeadline(current, { omitDate: input.omitDate })
        : simulateReduceTarget(current, { omitDate: input.omitDate });
  if (!simulation.feasible) {
    throw new GoalError('invalid', simulation.reason ?? 'El reajuste no es viable.');
  }
  if (input.kind === 'mover' && compareCivilDates(simulation.deadline, current.deadline) < 0) {
    throw new GoalError('invalid', 'Mover la fecha no puede adelantar la fecha final.');
  }
  return nextVersion(current, {
    omittedDates: omittedWith(current, input.omitDate),
    deadline: simulation.deadline,
    target: simulation.target,
  });
}

export function deferAdjustment(goal: Goal): Goal {
  return validateGoal(goal);
}

export function simulateDisbursement(
  goal: Goal,
  input: { milestoneId: string; amount: Cents; available: Cents },
): DisbursementSimulation {
  const current = validateGoal(goal);
  const amount = positive(input.amount, 'El desembolso debe ser mayor que cero.');
  const available = toCents(input.available, { allowNegative: true });
  const milestone = findMilestone(current, input.milestoneId);
  const milestonePending = milestonePendingOf(current, milestone.id);
  return {
    amount,
    reserve: current.state.reserve,
    milestonePending,
    requiresResolution: amount > milestonePending,
    increaseMilestone: coverageFor(amount, toCents(0), current.state.reserve, available),
    splitExcess: coverageFor(minCents(amount, milestonePending), subtractCents(amount, minCents(amount, milestonePending)), current.state.reserve, available),
  };
}

export function confirmDisbursement(
  goal: Goal,
  input: {
    id: string;
    milestoneId: string;
    amount: Cents;
    available: Cents;
    resolution?: MilestoneResolution;
    authorizeAvailable?: boolean;
    occurredOn: CivilDate;
  },
): DisbursementConfirmation {
  const current = validateGoal(goal);
  const occurredOn = validateDate(input.occurredOn);
  if (
    input.resolution !== undefined &&
    input.resolution !== 'aumentar-hito' &&
    input.resolution !== 'separar-excedente'
  ) {
    throw new GoalError('resolution', 'La resolución del desembolso no es válida.');
  }
  const simulation = simulateDisbursement(current, input);
  if (simulation.requiresResolution && !input.resolution) {
    throw new GoalError('resolution', 'El pago supera el pendiente del hito y necesita una resolución.');
  }
  const chosen = input.resolution === 'separar-excedente' ? simulation.splitExcess : simulation.increaseMilestone;
  if (chosen.requiresAvailableAuthorization && input.authorizeAvailable !== true) {
    throw new GoalError('authorization', 'Hay que autorizar el uso del disponible antes de confirmar el desembolso.');
  }
  const id = uniqueId(input.id, current, 'El desembolso necesita un identificador.');
  const milestone = findMilestone(current, input.milestoneId);
  const milestoneIncrease =
    input.resolution === 'aumentar-hito' && simulation.requiresResolution
      ? subtractCents(simulation.amount, simulation.milestonePending)
      : toCents(0);
  const milestones =
    milestoneIncrease > 0
      ? current.milestones.map((item) =>
          item.id === milestone.id ? { ...item, planned: addCents(item.planned, milestoneIncrease) } : item,
        )
      : current.milestones;
  const target = milestoneIncrease > 0 ? addCents(current.target, milestoneIncrease) : current.target;
  const immediateContributions =
    chosen.immediateContribution > 0
      ? [
          ...current.immediateContributions,
          {
            id: immediateContributionId(id, current),
            amount: chosen.immediateContribution,
            occurredOn,
            disbursementId: id,
          },
        ]
      : current.immediateContributions;
  const disbursements =
    chosen.linkedAmount > 0
      ? [...current.disbursements, { id, milestoneId: milestone.id, amount: chosen.linkedAmount, occurredOn }]
      : current.disbursements;
  return {
    goal: nextVersion(current, { target, milestones, immediateContributions, disbursements }),
    ordinaryExpense: input.resolution === 'separar-excedente' ? chosen.ordinaryExpense : toCents(0),
    warning: chosen.warning,
    immediateContribution: chosen.immediateContribution,
    balanceDelta: opposite(chosen.linkedAmount),
    reserveDelta: subtractCents(chosen.immediateContribution, chosen.linkedAmount),
    availableDelta: opposite(chosen.immediateContribution),
    projectedAvailable: chosen.projectedAvailable,
  };
}

export function milestoneViews(goal: Goal): readonly MilestoneView[] {
  const current = validateGoal(goal);
  return current.milestones.map((milestone) => {
    const used = usedOf(current, milestone.id);
    return { ...milestone, used, pending: subtractCents(milestone.planned, used) };
  });
}

function assemble(draft: Omit<Goal, 'schedule' | 'calendar' | 'feasible' | 'reason' | 'state'>): Goal {
  ensureMilestoneBounds(draft.milestones, draft.from, draft.deadline, draft.target);
  const built = buildPlan(draft);
  const state = computeState(draft);
  const goal: Goal = { ...draft, ...built, state };
  assertInvariants(goal);
  return goal;
}

function nextVersion(
  goal: Goal,
  patch: Partial<
    Pick<
      Goal,
      | 'target'
      | 'deadline'
      | 'milestones'
      | 'contributions'
      | 'immediateContributions'
      | 'disbursements'
      | 'omittedDates'
    >
  >,
): Goal {
  const { history, id, name, ...version } = goal;
  return assemble({
    ...goal,
    ...patch,
    id,
    name,
    version: goal.version + 1,
    history: [...history, version],
  });
}

function buildPlan(
  draft: Omit<Goal, 'schedule' | 'calendar' | 'feasible' | 'reason' | 'state' | 'history' | 'id' | 'name' | 'version'> & {
    version?: number;
  },
): Pick<Goal, 'schedule' | 'calendar' | 'feasible' | 'reason'> {
  let dates: CivilDate[];
  try {
    dates = availableDates(draft);
  } catch (error) {
    if (error instanceof GoalError && error.code === 'range') {
      throw error;
    }
    throw error;
  }
  const state = computeState(draft);
  if (draft.milestones.length === 0) {
    return planSimple(draft, dates, state.pending);
  }
  return planMilestones(draft, dates, state.reserve);
}

function planSimple(
  draft: { deadline: CivilDate; milestones: readonly Milestone[]; disbursements: readonly GoalDisbursement[] },
  dates: readonly CivilDate[],
  pending: Cents,
): Pick<Goal, 'schedule' | 'calendar' | 'feasible' | 'reason'> {
  if (pending === 0) {
    return { schedule: [], calendar: calendarFor(draft, []), feasible: true, reason: null };
  }
  if (dates.length === 0) {
    return {
      schedule: [],
      calendar: calendarFor(draft, []),
      feasible: false,
      reason: 'No hay fechas de aportación disponibles para cubrir el pendiente.',
    };
  }
  const schedule = allocateCentsToDates(pending, dates)
    .filter((entry) => entry.amount > 0)
    .map((entry) => ({
      date: entry.date,
      amount: entry.amount,
      milestoneId: null,
    }));
  return { schedule, calendar: calendarFor(draft, schedule), feasible: true, reason: null };
}

function planMilestones(
  draft: { deadline: CivilDate; target: Cents; milestones: readonly Milestone[]; disbursements: readonly GoalDisbursement[] },
  dates: readonly CivilDate[],
  reserve: Cents,
): Pick<Goal, 'schedule' | 'calendar' | 'feasible' | 'reason'> {
  const schedule: ScheduledContribution[] = [];
  const consumed = new Set<string>();
  let pool = reserve;
  let index = 0;
  while (index < draft.milestones.length) {
    const due = draft.milestones[index].due;
    const group: Milestone[] = [];
    while (index < draft.milestones.length && compareCivilDates(draft.milestones[index].due, due) === 0) {
      group.push(draft.milestones[index]);
      index += 1;
    }
    const needs: { id: string; name: string; left: Cents }[] = [];
    for (const milestone of group) {
      const pending = subtractCents(milestone.planned, usedOf(draft, milestone.id));
      const covered = minCents(pool, pending);
      const shortfall = subtractCents(pending, covered);
      pool = subtractCents(pool, covered);
      if (shortfall > 0) {
        needs.push({ id: milestone.id, name: milestone.name, left: shortfall });
      }
    }
    const groupShortfall = needs.reduce((total, item) => addCents(total, item.left), toCents(0));
    if (groupShortfall === 0) {
      continue;
    }
    const stageDates = dates.filter((date) => compareCivilDates(date, due) <= 0 && !consumed.has(formatIsoDate(date)));
    if (stageDates.length === 0) {
      return {
        schedule: [],
        calendar: calendarFor(draft, []),
        feasible: false,
        reason: `No hay fechas suficientes para cubrir el hito ${needs[0].name} antes de su fecha límite.`,
      };
    }
    const allocations = allocateCentsToDates(groupShortfall, stageDates).filter((entry) => entry.amount > 0);
    for (const allocation of allocations) {
      let remaining = allocation.amount;
      while (remaining > 0 && needs.length > 0) {
        const take = minCents(remaining, needs[0].left);
        if (take > 0) {
          schedule.push({ date: allocation.date, amount: take, milestoneId: needs[0].id });
        }
        remaining = subtractCents(remaining, take);
        needs[0] = { ...needs[0], left: subtractCents(needs[0].left, take) };
        if (needs[0].left === 0) {
          needs.shift();
        }
      }
      consumed.add(formatIsoDate(allocation.date));
    }
  }
  const remainder = subtractCents(draft.target, sumMilestones(draft.milestones));
  const coveredRemainder = minCents(pool, remainder);
  const rest = subtractCents(remainder, coveredRemainder);
  if (rest > 0) {
    const restDates = dates.filter((date) => !consumed.has(formatIsoDate(date)));
    if (restDates.length === 0) {
      return {
        schedule: [],
        calendar: calendarFor(draft, []),
        feasible: false,
        reason: 'No hay fechas suficientes para cubrir el objetivo después de los hitos.',
      };
    }
    for (const entry of allocateCentsToDates(rest, restDates)) {
      schedule.push({ date: entry.date, amount: entry.amount, milestoneId: null });
    }
  }
  return { schedule, calendar: calendarFor(draft, schedule), feasible: true, reason: null };
}

function calendarFor(
  draft: { milestones: readonly Milestone[]; disbursements: readonly GoalDisbursement[] },
  schedule: readonly ScheduledContribution[],
): CalendarEntry[] {
  const contributions: CalendarEntry[] = schedule.map((entry) => ({
    kind: 'aportacion',
    date: entry.date,
    amount: entry.amount,
    milestoneId: entry.milestoneId,
  }));
  const milestones: CalendarEntry[] = draft.milestones.map((milestone) => ({
    kind: 'hito',
    milestoneId: milestone.id,
    name: milestone.name,
    date: milestone.due,
    pending: subtractCents(milestone.planned, usedOf(draft, milestone.id)),
  }));
  return [...contributions, ...milestones];
}

function computeState(draft: {
  target: Cents;
  openingSavings: Cents;
  contributions: readonly RecordedContribution[];
  immediateContributions: readonly ImmediateContribution[];
  disbursements: readonly GoalDisbursement[];
}): GoalState {
  const contributed = addCents(sumAmounts(draft.contributions), sumAmounts(draft.immediateContributions));
  const utilized = sumAmounts(draft.disbursements);
  const reserve = subtractCents(addCents(draft.openingSavings, contributed), utilized);
  const progress = addCents(reserve, utilized);
  const pending = compareCents(draft.target, progress) > 0 ? subtractCents(draft.target, progress) : toCents(0);
  return { reserve, utilized, progress, pending };
}

function assertInvariants(goal: Goal): void {
  const state = computeState(goal);
  if (
    state.reserve < 0 ||
    state.reserve > state.progress ||
    state.utilized < 0 ||
    state.progress !== addCents(state.reserve, state.utilized) ||
    state.pending !== (goal.target > state.progress ? subtractCents(goal.target, state.progress) : 0)
  ) {
    throw new GoalError('invalid', 'La meta rompe las invariantes de reserva, progreso o pendiente.');
  }
}

function coverageFor(linked: Cents, ordinary: Cents, reserve: Cents, available: Cents): CoveragePreview {
  const coveredByReserve = minCents(reserve, linked);
  const immediateContribution = subtractCents(linked, coveredByReserve);
  const projectedAvailable = subtractCents(subtractCents(available, immediateContribution), ordinary);
  return {
    linkedAmount: linked,
    ordinaryExpense: ordinary,
    coveredByReserve,
    immediateContribution,
    projectedAvailable,
    warning: projectedAvailable < 0 ? NEGATIVE_AVAILABLE_WARNING : null,
    requiresAvailableAuthorization: immediateContribution > 0,
  };
}

function availableDates(draft: {
  from: CivilDate;
  deadline: CivilDate;
  frequency: ContributionFrequency;
  omittedDates: readonly CivilDate[];
}): CivilDate[] {
  ensureDeadlineOrder(draft.from, draft.deadline);
  const omitted = dateSet(draft.omittedDates);
  try {
    return contributionDates({ from: draft.from, deadline: draft.deadline, frequency: draft.frequency }).filter(
      (date) => !omitted.has(formatIsoDate(date)),
    );
  } catch (error) {
    if (error instanceof DateError) {
      throw new GoalError(error.code === 'range' ? 'range' : 'invalid', error.message);
    }
    throw error;
  }
}

function earliestDeadline(
  from: CivilDate,
  frequency: ContributionFrequency,
  needed: number,
  omitted: ReadonlySet<string>,
  notBefore: CivilDate,
): CivilDate | null {
  let horizon = compareCivilDates(notBefore, from) < 0 ? from : notBefore;
  for (let step = 0; step < 80; step += 1) {
    const dates = datesUntil(from, horizon, frequency, omitted);
    if (dates.length >= needed) {
      const enoughAt = dates[needed - 1];
      if (compareCivilDates(enoughAt, notBefore) >= 0) {
        return enoughAt;
      }
      const later = dates.find((date) => compareCivilDates(date, notBefore) >= 0);
      if (later) {
        return later;
      }
    }
    const anchor = dates.length > 0 ? dates[dates.length - 1] : horizon;
    try {
      horizon = addDays(anchor, 32);
    } catch (error) {
      if (error instanceof DateError) {
        break;
      }
      throw error;
    }
  }
  const dates = datesUntil(from, civilDate(9999, 12, 31), frequency, omitted);
  if (dates.length < needed) {
    return null;
  }
  const enoughAt = dates[needed - 1];
  if (compareCivilDates(enoughAt, notBefore) >= 0) {
    return enoughAt;
  }
  return dates.find((date) => compareCivilDates(date, notBefore) >= 0) ?? null;
}

function datesUntil(
  from: CivilDate,
  deadline: CivilDate,
  frequency: ContributionFrequency,
  omitted: ReadonlySet<string>,
): CivilDate[] {
  if (compareCivilDates(deadline, from) < 0) {
    return [];
  }
  return contributionDates({ from, deadline, frequency }).filter((date) => !omitted.has(formatIsoDate(date)));
}

function datesNeeded(pending: Cents, preserved: Cents): number | null {
  if (pending === 0) {
    return 0;
  }
  if (preserved <= 0) {
    return null;
  }
  return Math.ceil(pending / preserved);
}

function preservedAmount(goal: Goal, omitDate: CivilDate | undefined): Cents {
  if (omitDate) {
    const match = goal.schedule.find((entry) => formatIsoDate(entry.date) === formatIsoDate(validateDate(omitDate)));
    if (!match) {
      throw new GoalError('not-found', 'La fecha no tiene una aportación programada.');
    }
    return match.amount;
  }
  return goal.schedule[0]?.amount ?? toCents(0);
}

function omittedWith(goal: Goal, omitDate: CivilDate | undefined): CivilDate[] {
  if (!omitDate) {
    return [...goal.omittedDates];
  }
  requireScheduled(goal, omitDate);
  return [...goal.omittedDates, validateDate(omitDate)];
}

function requireScheduled(goal: Goal, date: CivilDate): void {
  if (!isScheduled(goal, date)) {
    throw new GoalError('not-found', 'La fecha no tiene una aportación programada.');
  }
}

function isScheduled(goal: Goal, date: CivilDate): boolean {
  const iso = formatIsoDate(validateDate(date));
  return goal.schedule.some((entry) => formatIsoDate(entry.date) === iso);
}

function progressOf(goal: Goal): Cents {
  return goal.state.progress;
}

function usedOf(draft: { disbursements: readonly GoalDisbursement[] }, milestoneId: string): Cents {
  return draft.disbursements
    .filter((item) => item.milestoneId === milestoneId)
    .reduce((total, item) => addCents(total, item.amount), toCents(0));
}

function milestonePendingOf(goal: Goal, milestoneId: string): Cents {
  const milestone = findMilestone(goal, milestoneId);
  return subtractCents(milestone.planned, usedOf(goal, milestone.id));
}

function findMilestone(goal: Goal, milestoneId: string): Milestone {
  const milestone = goal.milestones.find((item) => item.id === milestoneId);
  if (!milestone) {
    throw new GoalError('not-found', 'El hito no existe en la meta.');
  }
  return milestone;
}

function ensureMilestoneBounds(
  milestones: readonly Milestone[],
  from: CivilDate,
  deadline: CivilDate,
  target: Cents,
): void {
  for (const milestone of milestones) {
    if (compareCivilDates(milestone.due, from) < 0 || compareCivilDates(milestone.due, deadline) > 0) {
      throw new GoalError('invalid', 'El hito debe quedar entre el inicio y la fecha final.');
    }
  }
  if (compareCents(sumMilestones(milestones), target) > 0) {
    throw new GoalError('invalid', 'La suma de los hitos supera el objetivo.');
  }
}

function immediateContributionId(disbursementId: string, goal: Goal): string {
  const known = new Set([
    disbursementId,
    ...goal.contributions.map((item) => item.id),
    ...goal.immediateContributions.map((item) => item.id),
    ...goal.disbursements.map((item) => item.id),
  ]);
  const base = `${disbursementId}:inmediata`;
  if (!known.has(base)) {
    return base;
  }
  let suffix = 2;
  while (known.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

function normalizeMilestones(milestones: readonly Milestone[], target: Cents): Milestone[] {
  const seen = new Set<string>();
  const normalized = milestones.map((milestone) => {
    const id = requiredId(milestone.id, 'El hito necesita un identificador.');
    if (seen.has(id)) {
      throw new GoalError('duplicate', 'Hay dos hitos con el mismo identificador.');
    }
    seen.add(id);
    return {
      id,
      name: requiredName(milestone.name),
      planned: positive(milestone.planned, 'El importe del hito debe ser mayor que cero.'),
      due: validateDate(milestone.due),
    };
  });
  normalized.sort((left, right) => compareCivilDates(left.due, right.due) || left.id.localeCompare(right.id));
  const planned = sumMilestones(normalized);
  if (planned > nonNegative(target, 'El objetivo no puede ser negativo.')) {
    throw new GoalError('invalid', 'La suma de los hitos supera el objetivo.');
  }
  return normalized;
}

function copyFrequency(frequency: ContributionFrequency): ContributionFrequency {
  if (frequency.kind === 'semanal') {
    if (!frequency.weekday) {
      throw new GoalError('invalid', 'La frecuencia semanal necesita un día.');
    }
    return { kind: 'semanal', weekday: frequency.weekday };
  }
  if (frequency.kind === 'quincena-calendario') {
    return { kind: 'quincena-calendario' };
  }
  if (frequency.kind === 'cada-14-dias') {
    return { kind: 'cada-14-dias', firstDate: validateDate(frequency.firstDate) };
  }
  if (frequency.kind === 'mensual') {
    return { kind: 'mensual', day: frequency.day };
  }
  throw new GoalError('invalid', 'La frecuencia no es válida.');
}

function ensureDeadlineOrder(from: CivilDate, deadline: CivilDate): void {
  if (compareCivilDates(deadline, from) < 0) {
    throw new GoalError('range', 'La fecha límite es anterior al inicio.');
  }
}

function validateGoal(goal: Goal): Goal {
  if (!goal || goal.version < 1 || !Array.isArray(goal.history)) {
    throw new GoalError('invalid', 'La meta no es válida.');
  }
  return goal;
}

function validateDate(date: CivilDate): CivilDate {
  try {
    return civilDate(date.year, date.month, date.day);
  } catch (error) {
    if (error instanceof DateError) {
      throw new GoalError('invalid', error.message);
    }
    throw error;
  }
}

function dateSet(dates: readonly CivilDate[]): Set<string> {
  return new Set(dates.map((date) => formatIsoDate(date)));
}

function requiredId(value: string, message: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalError('invalid', message);
  }
  return value.trim();
}

function requiredName(value: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalError('invalid', 'El nombre no puede estar vacío.');
  }
  return value.trim();
}

function uniqueId(value: string, goal: Goal, message: string): string {
  const id = requiredId(value, message);
  const known = [
    ...goal.contributions.map((item) => item.id),
    ...goal.immediateContributions.map((item) => item.id),
    ...goal.disbursements.map((item) => item.id),
  ];
  if (known.includes(id)) {
    throw new GoalError('duplicate', 'Ese identificador ya está usado en la meta.');
  }
  return id;
}

function nonNegative(value: Cents, message: string): Cents {
  const amount = toCents(value);
  if (amount < 0) {
    throw new GoalError('invalid', message);
  }
  return amount;
}

function positive(value: Cents, message: string): Cents {
  const amount = nonNegative(value, message);
  if (amount === 0) {
    throw new GoalError('invalid', message);
  }
  return amount;
}

function opposite(amount: Cents): Cents {
  return amount === 0 ? toCents(0) : subtractCents(toCents(0), amount);
}

function minCents(left: Cents, right: Cents): Cents {
  return compareCents(left, right) <= 0 ? left : right;
}

function multiply(amount: Cents, count: number): Cents {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new GoalError('invalid', 'La cantidad de fechas no es válida.');
  }
  let total = toCents(0);
  for (let index = 0; index < count; index += 1) {
    total = addCents(total, amount);
  }
  return total;
}

function sumAmounts(items: readonly { amount: Cents }[]): Cents {
  return items.reduce((total, item) => addCents(total, item.amount), toCents(0));
}

function sumMilestones(milestones: readonly Milestone[]): Cents {
  return milestones.reduce((total, milestone) => addCents(total, milestone.planned), toCents(0));
}
