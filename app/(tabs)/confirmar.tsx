import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useDemo } from '@/components/demo-state';
import { homeSnapshots, maskMoney } from '@/constants/demo';
import { Amount, Button, Card, Header, Muted, Screen } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';

export default function ConfirmMovementScreen() {
  const demo = useDemo();
  const money = (value: string) => maskMoney(value, demo.hideAmounts);
  const [error, setError] = useState('');
  const after = homeSnapshots.afterExpense;
  const missing = demo.draft.amount.trim().length === 0 || demo.draft.date.trim().length === 0;

  return (
    <Screen>
      <Header title={demo.draft.kind === 'gasto' ? 'Confirmar gasto' : 'Confirmar ingreso'} fallback="/registrar" />
      <Card>
        <Text style={styles.name}>{demo.draft.note || demo.draft.category}</Text>
        <Amount>{money(demo.draft.amount || '$0')}</Amount>
        <Muted>
          {demo.draft.category} · {demo.draft.date || 'Sin fecha'} · {demo.draft.account}
        </Muted>
      </Card>
      {demo.draft.kind === 'gasto' && demo.draft.amount === '$350' ? (
        <Card tone="mint">
          <Text style={styles.strong}>Después de registrarlo</Text>
          <Muted>
            En este recorrido de ejemplo, los gastos del mes se muestran como {money(after.gastos)} y el disponible
            estimado como {money(after.disponible)}.
          </Muted>
        </Card>
      ) : (
        <Card tone="yellow">
          <Text style={styles.strong}>Recorrido de ejemplo</Text>
          <Muted>El movimiento se guarda en este prototipo. Los totales ilustrados cambian con el gasto de muestra de $350.</Muted>
        </Card>
      )}
      {error ? <Muted>{error}</Muted> : null}
      <Button
        label="Confirmar y guardar"
        disabled={missing}
        onPress={() => {
          if (missing) {
            setError('Falta la cantidad o la fecha.');
            return;
          }
          demo.confirmMovement();
          router.replace('/inicio');
        }}
      />
      <Button label="Volver a editar" variant="secondary" onPress={() => router.push('/registrar')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  strong: {
    color: colors.ink,
    fontWeight: '800',
  },
});
