import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AccountMovements } from '@/components/account/movements';
import { ConfirmEmailGate, LoadingScreen, useAccountMode } from '@/components/account/mode';
import { useDemo } from '@/components/demo-state';
import { AppIcon } from '@/components/ui/icons';
import { Amount, Button, Card, ChoiceRow, Muted, Row, Screen } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';
import { demoMovements, homeSnapshots, maskMoney, type MovementKind } from '@/constants/demo';

const months = ['Agosto', 'Septiembre', 'Octubre'] as const;
const filters = ['Todos', 'Ingresos', 'Gastos'] as const;

export default function MovementsScreen() {
  const mode = useAccountMode();
  if (mode === 'loading') {
    return <LoadingScreen title="Movimientos" />;
  }
  if (mode === 'confirm') {
    return <ConfirmEmailGate title="Movimientos" />;
  }
  if (mode === 'ready') {
    return <AccountMovements />;
  }
  return <DemoMovements />;
}

function DemoMovements() {
  const demo = useDemo();
  const params = useLocalSearchParams<{ categoria?: string }>();
  const money = (value: string) => maskMoney(value, demo.hideAmounts);
  const [monthIndex, setMonthIndex] = useState(1);
  const [filter, setFilter] = useState<(typeof filters)[number]>(params.categoria ? 'Todos' : 'Todos');
  const [query, setQuery] = useState(params.categoria ?? '');
  const [searching, setSearching] = useState(Boolean(params.categoria));
  const month = months[monthIndex] ?? 'Septiembre';
  const snapshot = demo.savedMovement ? homeSnapshots.afterExpense : homeSnapshots.beforeExpense;

  const items = useMemo(() => {
    const saved = demo.savedMovement
      ? [
          {
            id: 'registrado',
            title: demo.savedMovement.note || demo.savedMovement.category,
            subtitle: `${demo.savedMovement.category} · ${demo.savedMovement.date}`,
            kind: demo.savedMovement.kind,
            amount: demo.savedMovement.amount,
            category: demo.savedMovement.category,
            destination: 'corregir' as const,
          },
        ]
      : [];
    return [...saved, ...demoMovements].filter((item) => !demo.removedMovementIds.includes(item.id));
  }, [demo.removedMovementIds, demo.savedMovement]);

  const visible = items.filter((item) => {
    const kindOk =
      filter === 'Todos' ||
      (filter === 'Ingresos' && item.kind === 'ingreso') ||
      (filter === 'Gastos' && item.kind === 'gasto');
    const edited = demo.movementEdits[item.id];
    const title = edited?.note || item.title;
    const haystack = `${title} ${item.category}`.toLowerCase();
    const queryOk = query.trim().length === 0 || haystack.includes(query.trim().toLowerCase());
    return kindOk && queryOk;
  });

  return (
    <Screen>
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
          placeholder="Buscar por nombre o categoría"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      ) : null}
      <View style={styles.month}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          onPress={() => setMonthIndex((current) => Math.max(0, current - 1))}
          style={styles.monthButton}
        >
          <AppIcon name="chevron-left" />
        </Pressable>
        <Text style={styles.monthLabel}>{month}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          onPress={() => setMonthIndex((current) => Math.min(months.length - 1, current + 1))}
          style={styles.monthButton}
        >
          <AppIcon name="chevron-right" />
        </Pressable>
      </View>

      {month === 'Septiembre' ? (
        <>
          <View style={styles.totals}>
            <Card>
              <Muted>Ingresos</Muted>
              <Amount compact>{money(snapshot.ingresos)}</Amount>
            </Card>
            <Card>
              <Muted>Gastos</Muted>
              <Amount compact>{money(snapshot.gastos)}</Amount>
            </Card>
          </View>
          <ChoiceRow options={filters} value={filter} onChange={setFilter} />
          <Card>
            {visible.length === 0 ? <Muted>No hay movimientos con ese filtro.</Muted> : null}
            {visible.map((item) => {
              const edit = demo.movementEdits[item.id];
              return (
                <MovementRow
                  key={item.id}
                  title={edit?.note || item.title}
                  subtitle={item.subtitle}
                  amount={money(edit?.amount || item.amount)}
                  kind={item.kind}
                  onPress={() => {
                    if (item.destination === 'suscripciones') {
                      router.push('/suscripciones');
                      return;
                    }
                    router.push({ pathname: '/corregir', params: { id: item.id } });
                  }}
                />
              );
            })}
          </Card>
        </>
      ) : (
        <Card tone="soft">
          <Text style={styles.emptyTitle}>Sin movimientos de ejemplo</Text>
          <Muted>Este mes forma parte del recorrido visual. Los registros de muestra están en septiembre.</Muted>
        </Card>
      )}
      <Button label="Nuevo movimiento" icon="plus" onPress={() => router.push('/registrar')} />
    </Screen>
  );
}

function MovementRow({
  title,
  subtitle,
  amount,
  kind,
  onPress,
}: {
  title: string;
  subtitle: string;
  amount: string;
  kind: MovementKind;
  onPress: () => void;
}) {
  return (
    <Row
      icon={kind === 'ingreso' ? 'arrow-up' : 'arrow-down'}
      title={title}
      subtitle={subtitle}
      value={amount}
      valueStyle={{ color: kind === 'ingreso' ? colors.positive : colors.coralInk }}
      onPress={onPress}
    />
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
  emptyTitle: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 16,
  },
});
