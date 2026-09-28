import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDemo } from '@/components/demo-state';
import { maskMoney } from '@/constants/demo';
import { Amount, Button, Card, Chip, Field, Header, Muted, Row, Screen, SectionTitle } from '@/components/ui/primitives';

export default function SubscriptionsScreen() {
  const demo = useDemo();
  const money = (value: string) => maskMoney(value, demo.hideAmounts);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [when, setWhen] = useState('');

  return (
    <Screen>
      <Header title="Suscripciones" fallback="/calendario" />
      <Card tone="mint">
        <View style={styles.totalRow}>
          <View>
            <Muted>Total mensual de ejemplo</Muted>
            <Amount>{money('$1,217')}</Amount>
          </View>
          <Chip label={`${demo.subscriptions.length} activas`} />
        </View>
        <Muted>Este total es ilustrativo. Una suscripción nueva se lista, pero no se suma todavía.</Muted>
      </Card>
      <SectionTitle>Próximos cobros</SectionTitle>
      <Card>
        {demo.subscriptions.map((item) => (
          <Row key={item.id} icon={item.icon} title={item.name} subtitle={item.when} value={money(item.amount)} />
        ))}
      </Card>
      <Muted>Aparecen como compromisos. Solo crean un gasto cuando los confirmes.</Muted>
      {adding ? (
        <Card>
          <Field label="Nombre" value={name} onChangeText={setName} />
          <Field label="Cantidad" value={amount} onChangeText={setAmount} />
          <Field label="Siguiente cobro" value={when} onChangeText={setWhen} placeholder="Por ejemplo, 2 nov" />
          <Button
            label="Guardar suscripción"
            disabled={name.trim().length === 0 || amount.trim().length === 0}
            onPress={() => {
              demo.addSubscription({
                name: name.trim(),
                amount: amount.trim().startsWith('$') ? amount.trim() : `$${amount.trim()}`,
                when: when.trim() || 'Por confirmar',
              });
              setName('');
              setAmount('');
              setWhen('');
              setAdding(false);
            }}
          />
        </Card>
      ) : (
        <Button label="Agregar suscripción" icon="plus" onPress={() => setAdding(true)} />
      )}
      <Button label="Ver calendario" variant="secondary" onPress={() => router.push('/calendario')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
});
