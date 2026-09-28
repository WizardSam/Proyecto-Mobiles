import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { useDemo } from '@/components/demo-state';
import { milestones, maskMoney } from '@/constants/demo';
import { Amount, Button, Card, Header, Muted, Row, Screen, SectionTitle } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';

export default function GoalPreviewScreen() {
  const demo = useDemo();
  const money = (value: string) => maskMoney(value, demo.hideAmounts);
  const frequencyLabel =
    demo.goalDraft.frequency === 'Semana' ? 'semana' : demo.goalDraft.frequency === 'Mes' ? 'mes' : 'quincena';

  return (
    <Screen>
      <Header title="Tu plan" fallback="/nueva-meta" />
      <Card tone="mint">
        <Text style={styles.kicker}>{demo.goalDraft.name}</Text>
        <Muted>Necesitas apartar, en este ejemplo</Muted>
        <Amount>{money('$1,250')}</Amount>
        <Text style={styles.period}>por {frequencyLabel}</Text>
      </Card>
      <Card tone="soft">
        <Muted>
          Recorrido de ejemplo hasta el {demo.goalDraft.deadline}. El motor todavía no calcula esta cuota.
        </Muted>
      </Card>
      {demo.goalDraft.partials ? (
        <>
          <SectionTitle>Pagos planeados</SectionTitle>
          <Card>
            {milestones.map((item) => (
              <Row key={item.id} icon={item.icon} title={item.title} subtitle={item.when} value={money(item.amount)} />
            ))}
          </Card>
        </>
      ) : (
        <Card>
          <Muted>Esta meta de ejemplo no lleva pagos parciales.</Muted>
        </Card>
      )}
      <Button label="Crear mi ruta" onPress={() => router.replace('/detalle-meta')} />
      <Button label="Modificar datos" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: colors.primary,
    fontWeight: '800',
    textAlign: 'center',
  },
  period: {
    color: colors.ink,
    fontWeight: '800',
    textAlign: 'center',
  },
});
