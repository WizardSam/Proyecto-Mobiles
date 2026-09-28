import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDemo } from '@/components/demo-state';
import { cancun, emergency, maskMoney, milestones } from '@/constants/demo';
import { Amount, Button, Card, Chip, Header, Muted, ProgressBar, Row, Screen, SectionTitle } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';

export default function GoalDetailScreen() {
  const demo = useDemo();
  const params = useLocalSearchParams<{ meta?: string }>();
  const emergencyGoal = params.meta === 'emergencia';
  const money = (value: string) => maskMoney(value, demo.hideAmounts);
  const route = demo.goalRoute;
  const [asking, setAsking] = useState(false);
  const [emergencyNoted, setEmergencyNoted] = useState(false);
  const name = emergencyGoal ? emergency.name : demo.goalDraft.name || cancun.name;

  return (
    <Screen>
      <Header title={name} fallback="/metas" />
      <Chip icon="target" label={emergencyGoal ? emergency.status : route.status} />
      <Card>
        <View style={styles.progressRow}>
          <View>
            <Muted>Progreso</Muted>
            <Amount>{emergencyGoal ? emergency.percentLabel : cancun.percentLabel}</Amount>
          </View>
          <Text style={styles.saved}>
            {money(emergencyGoal ? emergency.saved : cancun.saved)} de{' '}
            {money(emergencyGoal ? emergency.target : route.target)}
          </Text>
        </View>
        <ProgressBar percent={emergencyGoal ? emergency.percent : cancun.percent} />
      </Card>
      {emergencyGoal ? (
        <Card tone="soft">
          <Muted>Meta sencilla de ejemplo, sin pagos parciales.</Muted>
          {emergencyNoted ? <Muted>Aportación de ejemplo anotada en esta visita.</Muted> : null}
        </Card>
      ) : (
        <>
          <Card tone="mint">
            <Muted>Próxima aportación</Muted>
            <View style={styles.next}>
              <Text style={styles.nextAmount}>{money(route.nextAmount)}</Text>
              <Text style={styles.nextDate}>{route.nextDate}</Text>
            </View>
            <Muted>Las etapas de vuelos, hotel y actividades pueden pedir cantidades distintas.</Muted>
          </Card>
          {demo.contributionSaved ? (
            <Card tone="yellow">
              <Text style={styles.savedTitle}>Aportación de ejemplo registrada</Text>
              <Muted>Quedó anotada en este prototipo. La ruta no se recalcula todavía.</Muted>
            </Card>
          ) : null}
          <SectionTitle>Tu ruta</SectionTitle>
          <Card>
            {milestones.map((item) => (
              <Row key={item.id} icon={item.icon} title={item.title} subtitle={item.when} value={money(item.amount)} />
            ))}
          </Card>
          <Muted>Fecha límite de ejemplo: {route.deadline}</Muted>
        </>
      )}
      {asking ? (
        <Card>
          <Text style={styles.savedTitle}>¿Registrar la aportación de ejemplo?</Text>
          <Muted>Una aportación reserva dinero para la meta. No es un ingreso ni un gasto.</Muted>
          <Button
            label="Confirmar aportación"
            onPress={() => {
              if (emergencyGoal) {
                setEmergencyNoted(true);
              } else {
                demo.confirmContribution();
              }
              setAsking(false);
            }}
          />
          <Button label="Cancelar" variant="secondary" onPress={() => setAsking(false)} />
        </Card>
      ) : (
        <Button label="Registrar aportación" onPress={() => setAsking(true)} />
      )}
      {emergencyGoal ? null : (
        <Button label="Simular cambios" variant="secondary" onPress={() => router.push('/reajustar')} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  saved: {
    flex: 1,
    textAlign: 'right',
    color: colors.ink,
    fontWeight: '800',
  },
  next: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextAmount: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  nextDate: {
    color: colors.muted,
    fontWeight: '700',
  },
  savedTitle: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 16,
  },
});
