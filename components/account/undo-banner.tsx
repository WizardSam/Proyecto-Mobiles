import { useSyncExternalStore } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button, Card, Muted } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';
import {
  getPendingDeletionSnapshot,
  subscribePendingDeletion,
  undoPendingDeletion,
} from '@/src/movements/pending-deletion';

export function PendingDeletionBanner() {
  const pending = useSyncExternalStore(
    subscribePendingDeletion,
    getPendingDeletionSnapshot,
    getPendingDeletionSnapshot,
  );

  if (pending.undoable && pending.id) {
    return (
      <Card tone="yellow">
        <Text style={styles.banner}>Movimiento eliminado</Text>
        <Muted>Puedes deshacerlo durante unos segundos.</Muted>
        <Button label="Deshacer" variant="secondary" onPress={undoPendingDeletion} />
      </Card>
    );
  }
  if (pending.id) {
    return (
      <Card tone="yellow">
        <Text style={styles.banner}>Eliminando el movimiento…</Text>
      </Card>
    );
  }
  if (pending.error) {
    return (
      <Card tone="yellow">
        <Text>{pending.error}</Text>
      </Card>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  banner: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 16,
  },
});
