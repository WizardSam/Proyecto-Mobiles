import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useDemo } from '@/components/demo-state';
import { accounts, maskMoney } from '@/constants/demo';
import { Button, Card, Field, Header, Muted, Screen, SectionTitle } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';

export default function ProfileScreen() {
  const demo = useDemo();
  const money = (value: string) => maskMoney(value, demo.hideAmounts);
  const [deleting, setDeleting] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const frequencyDetail =
    demo.setup.frequency === 'Quincenal'
      ? `${demo.setup.frequency} · ${demo.setup.fortnightMode}`
      : demo.setup.frequency === 'Semanal'
        ? `${demo.setup.frequency} · ${demo.setup.weekday}`
        : demo.setup.frequency;

  return (
    <Screen>
      <Header title="Perfil" fallback="/inicio" />
      <Card tone="yellow">
        <Text style={styles.value}>Demostración local</Text>
        <Muted>Este perfil no es una cuenta real. Borrar aquí no elimina datos de Supabase.</Muted>
      </Card>
      <Field label="Nombre" value={demo.displayName} onChangeText={demo.setDisplayName} />
      <Card>
        <Text style={styles.label}>Moneda</Text>
        <Text style={styles.value}>Pesos mexicanos (MXN)</Text>
        <Text style={styles.label}>Zona horaria</Text>
        <Text style={styles.value}>America/Mexico_City</Text>
        <Text style={styles.label}>Ingresos</Text>
        <Text style={styles.value}>{frequencyDetail}</Text>
      </Card>
      <SectionTitle>Cuentas</SectionTitle>
      <Muted>Efectivo, débito y ahorro. Las tarjetas de crédito no forman parte de este prototipo.</Muted>
      {accounts.map((account) => {
        const balance = demo.setup.balances[account];
        return (
          <Card key={account}>
            <Text style={styles.value}>{account}</Text>
            <Muted>{balance.trim().length > 0 ? `Saldo inicial ${money(balance)}` : 'Sin saldo inicial'}</Muted>
          </Card>
        );
      })}
      <Card>
        <Text style={styles.value}>Sin conectar tu banco</Text>
        <Muted>Ahorruta no pide credenciales bancarias ni mueve dinero.</Muted>
      </Card>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: demo.hideAmounts }}
        onPress={() => demo.setHideAmounts(!demo.hideAmounts)}
        style={styles.switchRow}
      >
        <View style={styles.switchCopy}>
          <Text style={styles.value}>Ocultar cantidades</Text>
          <Muted>Preferencia local de este prototipo.</Muted>
        </View>
        <View style={[styles.switch, demo.hideAmounts && styles.switchOn]}>
          <View style={[styles.knob, demo.hideAmounts && styles.knobOn]} />
        </View>
      </Pressable>
      <SectionTitle>Cuenta</SectionTitle>
      {acknowledged ? (
        <Card tone="yellow">
          <Text style={styles.value}>Confirmación registrada en el prototipo</Text>
          <Muted>
            Esta confirmación no borra una cuenta real. La eliminación definitiva está en Mi cuenta.
          </Muted>
        </Card>
      ) : null}
      {deleting ? (
        <Card>
          <Text style={styles.value}>Eliminar cuenta</Text>
          <Muted>Escribe ELIMINAR para confirmar. Aquí no se elimina la cuenta real.</Muted>
          <TextInput
            value={phrase}
            onChangeText={setPhrase}
            autoCapitalize="characters"
            placeholder="ELIMINAR"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <Button
            label="Confirmar eliminación"
            disabled={phrase.trim().toUpperCase() !== 'ELIMINAR'}
            onPress={() => {
              setAcknowledged(true);
              setDeleting(false);
              setPhrase('');
            }}
          />
          <Button label="Cancelar" variant="secondary" onPress={() => setDeleting(false)} />
        </Card>
      ) : (
        <Button label="Eliminar cuenta" variant="secondary" onPress={() => setDeleting(true)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  value: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
  },
  switchCopy: {
    flex: 1,
    gap: 4,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  switchOn: {
    backgroundColor: colors.primary,
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  knobOn: {
    marginLeft: 20,
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#F7F4EE',
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 16,
  },
});
