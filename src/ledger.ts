import { civilDate, compareCivilDates, DateError, type CivilDate } from './dates';
import { addCents, subtractCents, toCents, type Cents } from './money';

export type AccountKind = 'efectivo' | 'debito' | 'ahorro';

export type MovementKind = 'ingreso' | 'gasto' | 'aportacion';

export type MovementStatus = 'confirmado' | 'pendiente';

export type BudgetStatus = 'normal' | 'proximo' | 'alcanzado' | 'excedido';

export type LedgerErrorCode = 'invalid' | 'unknown-account' | 'range';

export class LedgerError extends Error {
  readonly code: LedgerErrorCode;

  constructor(code: LedgerErrorCode, message: string) {
    super(message);
    this.name = 'LedgerError';
    this.code = code;
  }
}

export type LedgerAccount = {
  readonly id: string;
  readonly kind: AccountKind;
  readonly openingBalance: Cents;
  readonly active: boolean;
};

export type LedgerMovement = {
  readonly id: string;
  readonly accountId: string;
  readonly kind: MovementKind;
  readonly amount: Cents;
  readonly status: MovementStatus;
  readonly occurredOn: CivilDate;
  readonly categoryId?: string;
};

export type InclusivePeriod = {
  readonly start: CivilDate;
  readonly end: CivilDate;
};

export type Budget = {
  readonly id: string;
  readonly categoryId: string;
  readonly period: InclusivePeriod;
  readonly limit: Cents;
};

export type AccountBalance = {
  readonly accountId: string;
  readonly kind: AccountKind;
  readonly active: boolean;
  readonly balance: Cents;
};

export type BalanceSummary = {
  readonly accounts: readonly AccountBalance[];
  readonly totalBalance: Cents;
  readonly reserved: Cents;
  readonly available: Cents;
  readonly income: Cents;
  readonly expenses: Cents;
  readonly contributions: Cents;
};

export type BudgetEvaluation = {
  readonly budgetId: string;
  readonly categoryId: string;
  readonly limit: Cents;
  readonly used: Cents;
  readonly remaining: Cents;
  readonly status: BudgetStatus;
};

export type ViabilityAssessment = {
  readonly capacity: Cents;
  readonly requiredContribution: Cents;
  readonly shortfall: Cents;
  readonly sufficient: boolean;
  readonly blocksCreation: false;
};

const ACCOUNT_KINDS = new Set<AccountKind>(['efectivo', 'debito', 'ahorro']);
const MOVEMENT_KINDS = new Set<MovementKind>(['ingreso', 'gasto', 'aportacion']);
const MOVEMENT_STATUSES = new Set<MovementStatus>(['confirmado', 'pendiente']);

export function summarizeBalances(input: {
  accounts: readonly LedgerAccount[];
  movements: readonly LedgerMovement[];
  period: InclusivePeriod;
  reserved: Cents;
}): BalanceSummary {
  const accounts = validateAccounts(input.accounts);
  const movements = validateMovements(input.movements, accounts);
  const period = validatePeriod(input.period);
  const reserved = toCents(input.reserved);

  const balances = [...accounts.values()].map((account) => ({
    accountId: account.id,
    kind: account.kind,
    active: account.active,
    balance: balanceOf(account, movements),
  }));

  const totalBalance = balances
    .filter((account) => account.active)
    .reduce((total, account) => addCents(total, account.balance), toCents(0));

  return {
    accounts: balances,
    totalBalance,
    reserved,
    available: subtractCents(totalBalance, reserved),
    income: flowInPeriod(movements, accounts, period, 'ingreso'),
    expenses: flowInPeriod(movements, accounts, period, 'gasto'),
    contributions: flowInPeriod(movements, accounts, period, 'aportacion'),
  };
}

export function evaluateBudget(
  budget: Budget,
  movements: readonly LedgerMovement[],
  accounts: readonly LedgerAccount[],
): BudgetEvaluation {
  const accountMap = validateAccounts(accounts);
  const validatedMovements = validateMovements(movements, accountMap);
  const validatedBudget = validateBudget(budget);
  const used = validatedMovements
    .filter(
      (movement) =>
        movement.status === 'confirmado' &&
        movement.kind === 'gasto' &&
        movement.categoryId === validatedBudget.categoryId &&
        isWithin(movement.occurredOn, validatedBudget.period),
    )
    .reduce((total, movement) => addCents(total, movement.amount), toCents(0));

  return {
    budgetId: validatedBudget.id,
    categoryId: validatedBudget.categoryId,
    limit: validatedBudget.limit,
    used,
    remaining: subtractCents(validatedBudget.limit, used),
    status: budgetStatus(used, validatedBudget.limit),
  };
}

export function assessViability(input: {
  expectedIncome: Cents;
  estimatedExpenses: Cents;
  otherGoalContributions: Cents;
  requiredContribution: Cents;
  subscriptionDetail: Cents;
}): ViabilityAssessment {
  const expectedIncome = toCents(input.expectedIncome);
  const estimatedExpenses = toCents(input.estimatedExpenses);
  const otherGoalContributions = toCents(input.otherGoalContributions);
  const requiredContribution = toCents(input.requiredContribution);
  const subscriptionDetail = toCents(input.subscriptionDetail);
  if (subscriptionDetail > estimatedExpenses) {
    throw new LedgerError('invalid', 'Las suscripciones no pueden superar el gasto total estimado.');
  }

  const capacity = subtractCents(subtractCents(expectedIncome, estimatedExpenses), otherGoalContributions);
  const sufficient = capacity >= requiredContribution;
  return {
    capacity,
    requiredContribution,
    shortfall: sufficient ? toCents(0) : subtractCents(requiredContribution, capacity),
    sufficient,
    blocksCreation: false,
  };
}

function budgetStatus(used: Cents, limit: Cents): BudgetStatus {
  if (used > limit) {
    return 'excedido';
  }
  if (used === limit) {
    return 'alcanzado';
  }
  if (BigInt(used) * 5n >= BigInt(limit) * 4n) {
    return 'proximo';
  }
  return 'normal';
}

function balanceOf(account: LedgerAccount, movements: readonly LedgerMovement[]): Cents {
  return movements
    .filter((movement) => movement.accountId === account.id && movement.status === 'confirmado')
    .reduce((balance, movement) => {
      if (movement.kind === 'ingreso') {
        return addCents(balance, movement.amount);
      }
      if (movement.kind === 'gasto') {
        return subtractCents(balance, movement.amount);
      }
      return balance;
    }, account.openingBalance);
}

function flowInPeriod(
  movements: readonly LedgerMovement[],
  accounts: ReadonlyMap<string, LedgerAccount>,
  period: InclusivePeriod,
  kind: MovementKind,
): Cents {
  return movements
    .filter(
      (movement) =>
        accounts.has(movement.accountId) &&
        movement.status === 'confirmado' &&
        movement.kind === kind &&
        isWithin(movement.occurredOn, period),
    )
    .reduce((total, movement) => addCents(total, movement.amount), toCents(0));
}

function validateAccounts(accounts: readonly LedgerAccount[]): Map<string, LedgerAccount> {
  const byId = new Map<string, LedgerAccount>();
  for (const account of accounts) {
    const id = requiredId(account.id, 'La cuenta necesita un identificador.');
    if (!ACCOUNT_KINDS.has(account.kind)) {
      throw new LedgerError('invalid', 'La cuenta solo puede ser efectivo, débito o ahorro.');
    }
    if (typeof account.active !== 'boolean') {
      throw new LedgerError('invalid', 'La cuenta debe indicar si está activa.');
    }
    if (byId.has(id)) {
      throw new LedgerError('invalid', 'Hay dos cuentas con el mismo identificador.');
    }
    byId.set(id, {
      id,
      kind: account.kind,
      openingBalance: toCents(account.openingBalance, { allowNegative: true }),
      active: account.active,
    });
  }
  return byId;
}

function validateMovements(
  movements: readonly LedgerMovement[],
  accounts: ReadonlyMap<string, LedgerAccount>,
): LedgerMovement[] {
  const seen = new Set<string>();
  return movements.map((movement) => {
    const id = requiredId(movement.id, 'El movimiento necesita un identificador.');
    if (seen.has(id)) {
      throw new LedgerError('invalid', 'Hay dos movimientos con el mismo identificador.');
    }
    seen.add(id);
    if (!MOVEMENT_KINDS.has(movement.kind)) {
      throw new LedgerError('invalid', 'El movimiento solo puede ser ingreso, gasto o aportación.');
    }
    if (!MOVEMENT_STATUSES.has(movement.status)) {
      throw new LedgerError('invalid', 'El movimiento debe estar confirmado o pendiente.');
    }
    const accountId = requiredId(movement.accountId, 'El movimiento necesita una cuenta.');
    if (!accounts.has(accountId)) {
      throw new LedgerError('unknown-account', 'El movimiento refiere una cuenta desconocida.');
    }
    const categoryId = optionalId(movement.categoryId);
    if (movement.kind === 'gasto' && !categoryId) {
      throw new LedgerError('invalid', 'El gasto necesita una categoría.');
    }
    return {
      id,
      accountId,
      kind: movement.kind,
      amount: toCents(movement.amount),
      status: movement.status,
      occurredOn: validateDate(movement.occurredOn),
      categoryId,
    };
  });
}

function validateBudget(budget: Budget): Budget & { readonly limit: Cents; readonly period: InclusivePeriod } {
  return {
    id: requiredId(budget.id, 'El presupuesto necesita un identificador.'),
    categoryId: requiredId(budget.categoryId, 'El presupuesto necesita una categoría.'),
    period: validatePeriod(budget.period),
    limit: toCents(budget.limit),
  };
}

function validatePeriod(period: InclusivePeriod): InclusivePeriod {
  const start = validateDate(period.start);
  const end = validateDate(period.end);
  if (compareCivilDates(end, start) < 0) {
    throw new LedgerError('range', 'El periodo termina antes de empezar.');
  }
  return { start, end };
}

function validateDate(date: CivilDate): CivilDate {
  try {
    return civilDate(date.year, date.month, date.day);
  } catch (error) {
    if (error instanceof DateError) {
      throw new LedgerError('invalid', error.message);
    }
    throw error;
  }
}

function isWithin(date: CivilDate, period: InclusivePeriod): boolean {
  return compareCivilDates(date, period.start) >= 0 && compareCivilDates(date, period.end) <= 0;
}

function requiredId(value: string, message: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new LedgerError('invalid', message);
  }
  return value.trim();
}

function optionalId(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw new LedgerError('invalid', 'La categoría no es válida.');
  }
  return value.trim();
}
