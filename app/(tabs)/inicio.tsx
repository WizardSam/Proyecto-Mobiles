import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDemo } from '@/components/demo-state';
import { AppIcon } from '@/components/ui/icons';
import { Amount, Button, Card, Chip, Muted, Row, Screen, SectionTitle } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';
import { cancun, homeSnapshots, maskMoney } from '@/constants/demo';

export default function HomeScreen() {
  const demo = useDemo();
  const money = (value: string) => maskMoney(value, demo.hideAmounts);
  const snapshot = demo.savedMovement ? homeSnapshots.afterExpense : homeSnapshots.beforeExpense;
  const route = demo.goalRoute;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text style={styles.hello}>Hola, {demo.displayName}</Text>
          <View style={styles.subRow}>
            <AppIcon name="sun" size={16} color={colors.warn} />
            <Text style={styles.sub}>Qué bueno tenerte aquí</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
          onPress={() => router.push('/perfil')}
          style={styles.avatar}
        >
          <AppIcon name="user" color={colors.primary} />
        </Pressable>
      </View>

      {demo.setupStatus === 'skipped' ? (
        <Card tone="yellow">
          <Text style={styles.cardTitle}>Puedes completar tu configuración cuando quieras.</Text>
          <Button label="Completar ahora" variant="secondary" onPress={() => router.push('/configuracion')} />
        </Card>
      ) : null}

      <Card>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Disponible estimado</Text>
          <AppIcon name="info" size={16} color={colors.muted} />
        </View>
        <Amount>{money(snapshot.disponible)}</Amount>
        <Muted>Estimación según tus registros. Tu banco no está conectado.</Muted>
        <Chip icon="feather" label={snapshot.status} />
      </Card>

      <View style={styles.stats}>
        <Stat icon="arrow-up" label="Ingresos" value={money(snapshot.ingresos)} tint={colors.positiveSoft} />
        <Stat icon="arrow-down" label="Gastos" value={money(snapshot.gastos)} tint={colors.coral} />
        <Stat icon="target" label="Para tus metas" value={money(snapshot.metas)} tint={colors.yellowSoft} />
      </View>

      <SectionTitle>Lo siguiente</SectionTitle>
      <Card>
        <Row
          icon="map-pin"
          title={cancun.name}
          subtitle={`Aporta ${money(route.nextAmount)} el ${route.nextDate}`}
          onPress={() => router.push('/detalle-meta')}
        />
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
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
