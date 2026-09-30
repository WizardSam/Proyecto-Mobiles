import { parseIsoDate } from '../dates';
import type { LedgerAccount, LedgerMovement } from '../ledger';
import type { AccountRecord } from '../persistence/account-repository';
import type { MovementRecord } from '../persistence/movement-repository';

export function toLedgerInput(input: {
  accounts: readonly AccountRecord[];
  movements: readonly MovementRecord[];
}): { accounts: LedgerAccount[]; movements: LedgerMovement[] } {
  return {
    accounts: input.accounts.map((account) => ({
      id: account.id,
      kind: account.kind,
      openingBalance: account.openingBalance,
      active: account.active,
    })),
    movements: input.movements.map((movement) => ({
      id: movement.id,
      accountId: movement.accountId,
      kind: movement.kind,
      amount: movement.amount,
      status: movement.status,
      occurredOn: parseIsoDate(movement.occurredOn),
      categoryId: movement.categoryId,
    })),
  };
}
