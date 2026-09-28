import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useDemo } from '@/components/demo-state';
import { demoMovements } from '@/constants/demo';
import { Button, Card, Field, Header, Muted, Screen } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';

export default function CorrectMovementScreen() {
  const demo = useDemo();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? '';
  const saved = id === 'registrado' ? demo.savedMovement : null;
  const base = demoMovements.find((item) => item.id === id);
  const existing = demo.movementEdits[id];
  const [amount, setAmount] = useState(existing?.amount ?? saved?.amount ?? base?.amount ?? '');
  const [note, setNote] = useState(existing?.note ?? saved?.note ?? base?.title ?? '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!saved && !base) {
    return (
      <Screen>
        <Header title="Movimiento" fallback="/movimientos" />
        <Muted>No encontramos ese movimiento de ejemplo.</Muted>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Corregir movimiento" fallback="/movimientos" />
      <Card>
        <Text style={styles.title}>{base?.subtitle ?? saved?.category}</Text>
        <Muted>Los cambios se ven en la lista. Los totales de ejemplo no se recalculan todavía.</Muted>
      </Card>
      <Field label="Cantidad" value={amount} onChangeText={setAmount} />
      <Field label="Nota" value={note} onChangeText={setNote} />
      <Button
        label="Guardar corrección"
        onPress={() => {
          demo.editMovement(id, { amount, note });
          if (saved) {
            demo.updateSavedMovement({ amount, note });
          }
          router.replace('/movimientos');
        }}
      />
      {confirmingDelete ? (
        <Card tone="yellow">
          <Text style={styles.title}>¿Eliminar este movimiento?</Text>
          <Muted>Puedes deshacerlo de inmediato antes de salir de esta confirmación.</Muted>
          <Button
            label="Eliminar"
            onPress={() => {
              demo.removeMovement(id);
              if (id === 'registrado') {
                demo.clearSavedMovement();
              }
              router.replace('/movimientos');
            }}
          />
          <Button label="Deshacer" variant="secondary" onPress={() => setConfirmingDelete(false)} />
        </Card>
      ) : (
        <Button label="Eliminar movimiento" variant="secondary" onPress={() => setConfirmingDelete(true)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 18,
  },
});
