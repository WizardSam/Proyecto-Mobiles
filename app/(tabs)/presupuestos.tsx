import { StyleSheet, Text, View } from 'react-native';

import { useDemo } from '@/components/demo-state';
import { budgetsAfter, budgetsBefore, maskMoney, type BudgetTone } from '@/constants/demo';
import { AppIcon } from '@/components/ui/icons';
import { Card, Header, Muted, ProgressBar, Screen } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';

const toneLabel: Record<BudgetTone, string> = {
  normal: 'Dentro del límite',
  near: 'Cerca del límite',
  over: 'Límite cubierto',
};

export default function BudgetsScreen() {
  const demo = useDemo();
  const money = (value: string) => maskMoney(value, demo.hideAmounts);
  const items = demo.savedMovement ? budgetsAfter : budgetsBefore;

  return (
    <Screen>
      <Header title="Presupuestos" fallback="/resumen" />
      <Muted>Límites de ejemplo para septiembre. Los avisos informan, sin reclamar.</Muted>
      {items.map((item) => (
        <Card key={item.id}>
          <View style={styles.top}>
            <View style={styles.icon}>
              <AppIcon name={item.icon} color={colors.primary} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.name}>{item.name}</Text>
              <Muted>Límite {money(item.limit)}</Muted>
            </View>
            <Text style={[styles.badge, item.tone === 'over' && styles.badgeOver, item.tone === 'near' && styles.badgeNear]}>
              {toneLabel[item.tone]}
            </Text>
          </View>
          <ProgressBar percent={item.percent} />
          <View style={styles.figures}>
            <Text style={styles.figure}>Usado {money(item.used)}</Text>
            <Text style={styles.figure}>Restante {money(item.left)}</Text>
          </View>
          <Muted>{item.message}</Muted>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 16,
  },
  badge: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  badgeNear: {
    color: colors.warn,
  },
  badgeOver: {
    color: colors.coralInk,
  },
  figures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  figure: {
    color: colors.ink,
    fontWeight: '700',
  },
});
