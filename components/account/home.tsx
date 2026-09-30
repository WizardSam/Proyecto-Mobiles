import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LoadError, LoadingScreen, useFinance, useMaskedMoney } from '@/components/account/mode';
import { AppIcon } from '@/components/ui/icons';
import { Amount, Button, Card, Chip, Muted, Screen } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';
import { todayInTimeZone } from '@/src/dates';
import { summarizeBalances } from '@/src/ledger';
import { monthBounds } from '@/src/movements/period';
import { toLedgerInput } from '@/src/movements/to-ledger';
import { toCents } from '@/src/money';

export function AccountHome() {
  const { finance, error, loading, reload } = useFinance();
  const money = useMaskedMoney();

  const summary = useMemo(() => {
    if (!finance) {
      return null;
    }
    try {
      const today = todayInTimeZone();
      return summarizeBalances({
        ...toLedgerInput(finance),
        period: monthBounds(today),
        reserved: toCents(0),
      });
    } catch {
      return null;
    }
  }, [finance]);

  if (loading && !finance) {
    return <LoadingScreen title="Inicio" />;
  }
  if (error && !finance) {
    return <LoadError title="Inicio" message={error} onRetry={() => void reload()} />;
  }
  if (!finance || !summary) {
    return <LoadError title="Inicio" message="No se pudieron calcular tus saldos." onRetry={() => void reload()} />;
  }

  const greeting = finance.displayName.trim().length > 0 ? finance.displayName : 'Hola';

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text style={styles.hello}>Hola, {greeting}</Text>
          <Text style={styles.sub}>Estos números salen de tu cuenta.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir mi cuenta"
          onPress={() => router.push('/cuenta')}
          style={styles.avatar}
        >
          <AppIcon name="user" color={colors.primary} />
        </Pressable>
      </View>
      <Card>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Disponible estimado</Text>
          <AppIcon name="info" size={16} color={colors.muted} />
        </View>
        <Amount>{money(summary.available)}</Amount>
        <Muted>Estimación según tus registros. Tu banco no está conectado.</Muted>
        <Chip label="Según tus registros" />
      </Card>
      <View style={styles.stats}>
        <Stat icon="arrow-up" label="Ingresos" value={money(summary.income)} tint={colors.positiveSoft} />
        <Stat icon="arrow-down" label="Gastos" value={money(summary.expenses)} tint={colors.coral} />
        <Stat icon="target" label="Para tus metas" value={money(toCents(0))} tint={colors.yellowSoft} />
      </View>
      <Card tone="soft">
        <Text style={styles.cardTitle}>Metas</Text>
        <Muted>Las metas reales todavía no se guardan en la cuenta. Esta cantidad no viene de la demostración.</Muted>
      </Card>
      <Button label="Registrar movimiento" icon="plus" onPress={() => router.push('/registrar')} />
      <Button label="Ver resumen mensual" variant="secondary" onPress={() => router.push('/resumen')} />
    </Screen>
  );
}

function Stat({
  icon,
  label,
  value,
  tint,
}: {
  icon: 'arrow-up' | 'arrow-down' | 'target';
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>
        <AppIcon name={icon} size={16} color={colors.ink} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  greeting: {
    gap: 4,
    flex: 1,
  },
  hello: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  sub: {
    color: colors.muted,
    fontSize: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.muted,
    fontWeight: '700',
  },
  cardTitle: {
    color: colors.ink,
    fontWeight: '800',
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 10,
    gap: 6,
    minHeight: 108,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  statValue: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 14,
  },
});
