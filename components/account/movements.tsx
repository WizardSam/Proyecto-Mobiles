import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { IdChoices } from '@/components/account/id-choices';
import { LoadError, LoadingScreen, useFinance, useMaskedMoney } from '@/components/account/mode';
import { PendingDeletionBanner } from '@/components/account/undo-banner';
import { AppIcon } from '@/components/ui/icons';
import { Amount, Button, Card, ChoiceRow, Muted, Row, Screen } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';
import { civilDate, todayInTimeZone } from '@/src/dates';
import { summarizeBalances } from '@/src/ledger';
import {
  compareNewestFirst,
  isInMonth,
  longDate,
  monthBounds,
  monthTitle,
  shiftMonth,
} from '@/src/movements/period';
import { getPendingDeletionSnapshot, subscribePendingDeletion } from '@/src/movements/pending-deletion';
import { toLedgerInput } from '@/src/movements/to-ledger';
import { toCents } from '@/src/money';

const typeFilters = ['Todos', 'Ingresos', 'Gastos'] as const;

export function AccountMovements() {
  const { finance, error, loading, reload } = useFinance();
  const money = useMaskedMoney();
  const pending = useSyncExternalStore(subscribePendingDeletion, getPendingDeletionSnapshot, getPendingDeletionSnapshot);
  const [seenSettled, setSeenSettled] = useState(pending.settled);
  const [hiddenIds, setHiddenIds] = useState<readonly string[]>([]);
  const [trackedUndoId, setTrackedUndoId] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const today = todayInTimeZone();
    return civilDate(today.year, today.month, 1);
  });
  const [typeFilter, setTypeFilter] = useState<(typeof typeFilters)[number]>('Todos');
  const [categoryId, setCategoryId] = useState('todas');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (pending.settled === seenSettled) {
      return;
    }
    let active = true;
    void reload().finally(() => {
      if (!active) {
        return;
      }
      setSeenSettled(pending.settled);
      setHiddenIds(pending.id ? [pending.id] : []);
      if (!pending.id) {
        setTrackedUndoId(null);
      }
    });
    return () => {
      active = false;
    };
  }, [pending.id, pending.settled, reload, seenSettled]);

  const summary = useMemo(() => {
    if (!finance) {
      return null;
    }
    try {
      return summarizeBalances({
        ...toLedgerInput(finance),
        period: monthBounds(month),
        reserved: toCents(0),
      });
    } catch {
      return null;
    }
  }, [finance, month]);

  if (pending.id && !hiddenIds.includes(pending.id)) {
    setHiddenIds([...hiddenIds, pending.id]);
  }
  if (pending.undoable && pending.id !== trackedUndoId) {
    setTrackedUndoId(pending.id);
  }
  if (
    !pending.undoable &&
    trackedUndoId &&
    pending.id !== trackedUndoId &&
    pending.settled === seenSettled &&
    hiddenIds.includes(trackedUndoId)
  ) {
    const cancelled = trackedUndoId;
    setTrackedUndoId(null);
    setHiddenIds(hiddenIds.filter((id) => id !== cancelled));
  }

  if (loading && !finance) {
    return (
      <LoadingScreen title="Movimientos">
        <PendingDeletionBanner />
      </LoadingScreen>
    );
  }
  if ((error && !finance) || !finance) {
    return (
      <LoadError title="Movimientos" message={error || 'No se pudieron leer los movimientos.'} onRetry={() => void reload()}>
        <PendingDeletionBanner />
      </LoadError>
    );
  }

  const names = new Map(finance.categories.map((category) => [category.id, category.name]));
  const accountNames = new Map(finance.accounts.map((account) => [account.id, account.name]));
  const usedCategoryIds = new Set(finance.movements.map((movement) => movement.categoryId));
  const categoryOptions = [
    { id: 'todas', label: 'Todas' },
    ...finance.categories
      .filter((category) => usedCategoryIds.has(category.id))
      .map((category) => ({
        id: category.id,
        label: category.archivedAt ? `${category.name} (archivada)` : category.name,
      })),
  ];
  const inMonth = finance.movements
    .filter((movement) => !hiddenIds.includes(movement.id))
    .filter((movement) => isInMonth(movement.occurredOn, month));
  const visible = inMonth
    .filter((movement) => {
      if (typeFilter === 'Ingresos') {
        return movement.kind === 'ingreso';
      }
      if (typeFilter === 'Gastos') {
        return movement.kind === 'gasto';
      }
      return true;
    })
    .filter((movement) => categoryId === 'todas' || movement.categoryId === categoryId)
    .filter((movement) => {
      const needle = query.trim().toLowerCase();
      if (needle.length === 0) {
        return true;
      }
      const category = names.get(movement.categoryId) ?? '';
      return `${movement.note ?? ''} ${category}`.toLowerCase().includes(needle);
    })
    .sort(compareNewestFirst);

  return (
    <Screen>
      <PendingDeletionBanner />
      <View style={styles.top}>
        <Text style={styles.title}>Movimientos</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar movimiento"
          onPress={() => setSearching((current) => !current)}
          style={styles.search}
        >
          <AppIcon name="search" color={colors.ink} />
        </Pressable>
      </View>
      {searching ? (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nota o categoría"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      ) : null}
      <View style={styles.month}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          onPress={() => setMonth((current) => shiftMonth(current, -1))}
          style={styles.monthButton}
        >
          <AppIcon name="chevron-left" />
        </Pressable>
        <Text style={styles.monthLabel}>{monthTitle(month)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          onPress={() => setMonth((current) => shiftMonth(current, 1))}
          style={styles.monthButton}
        >
          <AppIcon name="chevron-right" />
        </Pressable>
      </View>
      {summary ? (
        <View style={styles.totals}>
          <Card>
            <Muted>Ingresos</Muted>
            <Amount compact>{money(summary.income)}</Amount>
          </Card>
          <Card>
            <Muted>Gastos</Muted>
            <Amount compact>{money(summary.expenses)}</Amount>
          </Card>
        </View>
      ) : (
        <Card tone="yellow">
          <Text>No se pudieron calcular los totales de este mes.</Text>
        </Card>
      )}
      <ChoiceRow options={typeFilters} value={typeFilter} onChange={setTypeFilter} />
      <IdChoices options={categoryOptions} value={categoryId} onChange={setCategoryId} />
      <Card>
        {visible.length === 0 ? (
          <Muted>
            {inMonth.length === 0
              ? 'No hay movimientos en este mes.'
              : 'Ningún movimiento coincide con la búsqueda o el filtro.'}
          </Muted>
        ) : null}
        {visible.map((movement) => {
          const category = names.get(movement.categoryId) ?? 'Categoría';
          const account = accountNames.get(movement.accountId) ?? 'Cuenta';
          const title = movement.goalDisbursementId ? 'Pago de meta' : movement.note || category;
          const subtitle = [
            category,
            longDate(movement.occurredOn),
            account,
            movement.goalDisbursementId ? 'Solo lectura' : null,
            movement.status === 'pendiente' ? 'Pendiente' : null,
          ]
            .filter((part) => part !== null)
            .join(' · ');
          return (
            <Row
              key={movement.id}
              icon={movement.kind === 'ingreso' ? 'arrow-up' : 'arrow-down'}
              title={title}
              subtitle={subtitle}
              value={money(movement.amount)}
              valueStyle={{ color: movement.kind === 'ingreso' ? colors.positive : colors.coralInk }}
              onPress={() => router.push({ pathname: '/corregir', params: { id: movement.id } })}
            />
          );
        })}
      </Card>
      <Button label="Categorías" variant="secondary" onPress={() => router.push('/categorias' as Href)} />
      <Button label="Nuevo movimiento" icon="plus" onPress={() => router.push('/registrar')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  search: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    color: colors.ink,
  },
  month: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  totals: {
    flexDirection: 'row',
    gap: 10,
  },
});
