import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDemo } from '@/components/demo-state';
import { AppIcon } from '@/components/ui/icons';
import { adjustmentOptions, maskMoney, type AdjustmentId } from '@/constants/demo';
import { Button, Card, Header, Muted, Screen } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';

export default function AdjustScreen() {
  const demo = useDemo();
  const money = (value: string) => maskMoney(value, demo.hideAmounts);
  const [choice, setChoice] = useState<AdjustmentId>('aumentar');

  return (
    <Screen>
      <Header title="Ajustar mi ruta" fallback="/detalle-meta" />
      <Card tone="yellow">
        <View style={styles.warn}>
          <AppIcon name="alert-triangle" color={colors.warn} />
          <Text style={styles.warnText}>Omitiste una aportación de {money('$1,250')}</Text>
        </View>
      </Card>
      <Muted>Tu meta sigue siendo posible. Elige cómo continuar. Nada cambia hasta que confirmes.</Muted>
      {adjustmentOptions.map((option) => {
        const selected = choice === option.id;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => setChoice(option.id)}
            style={[styles.option, selected && styles.optionOn]}
          >
            <View style={styles.optionIcon}>
              <AppIcon name={option.icon} color={colors.primary} />
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Muted>{money(option.detail)}</Muted>
            </View>
            <View style={[styles.radio, selected && styles.radioOn]} />
          </Pressable>
        );
      })}
      <Button
        label="Confirmar ajuste"
        onPress={() => {
          demo.confirmAdjustment(choice);
          router.replace('/detalle-meta');
        }}
      />
      <Button label="Decidir después" variant="secondary" onPress={() => router.replace('/detalle-meta')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  warn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  warnText: {
    flex: 1,
    color: colors.ink,
    fontWeight: '800',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionOn: {
    borderColor: colors.primary,
    backgroundColor: colors.mint,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    color: colors.ink,
    fontWeight: '800',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.muted,
  },
  radioOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
});
