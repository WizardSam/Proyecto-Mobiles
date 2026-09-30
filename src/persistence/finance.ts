import { loadAccounts, type AccountRecord } from './account-repository';
import { loadCategories, type CategoryRecord } from './category-repository';
import { loadMovements, type MovementRecord } from './movement-repository';
import { loadProfile } from './profile-repository';

export type FinanceData = {
  accounts: AccountRecord[];
  categories: CategoryRecord[];
  movements: MovementRecord[];
  lastAccountId: string | null;
  displayName: string;
};

export async function loadFinance(): Promise<FinanceData> {
  const [accounts, categories, movements, profile] = await Promise.all([
    loadAccounts(),
    loadCategories(),
    loadMovements(),
    loadProfile(true),
  ]);
  return {
    accounts,
    categories,
    movements,
    lastAccountId: profile?.lastAccountId ?? null,
    displayName: profile?.displayName ?? '',
  };
}
