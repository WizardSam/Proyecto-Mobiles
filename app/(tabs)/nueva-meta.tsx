import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDemo } from '@/components/demo-state';
import { AppIcon } from '@/components/ui/icons';
import { contributionFrequencies, type ContributionFrequency } from '@/constants/demo';
import { Button, Card, ChoiceRow, Field, Header, Muted, Screen } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';

export default function NewGoalScreen() {
  const demo = useDemo();
  const [name, setName] = useState(demo.goalDraft.name);
  const [total, setTotal] = useState(demo.goalDraft.total);
  const [saved, setSaved] = useState(demo.goalDraft.saved);
  const [deadline, setDeadline] = useState(demo.goalDraft.deadline);
  const [frequency, setFrequency] = useState<ContributionFrequency>(demo.goalDraft.frequency);
  const [partials, setPartials] = useState(demo.goalDraft.partials);

  return (
    <Screen>
      <Header title="Nueva meta" fallback="/metas" />
      <Field label="¿Qué quieres lograr?" value={name} onChangeText={setName} />
      <Field label="Cantidad total" value={total} onChangeText={setTotal} />
      <Field label="Ya tengo" value={saved} onChangeText={setSaved} />
      <Field label="Fecha límite" value={deadline} onChangeText={setDeadline} />
      <Text style={styles.label}>¿Cada cuándo quieres ahorrar?</Text>
      <ChoiceRow options={contributionFrequencies} value={frequency} onChange={setFrequency} />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: partials }}
        onPress={() => setPartials((current) => !current)}
        style={styles.check}
      >
        <View style={[styles.box, partials && styles.boxOn]}>
          {partials ? <AppIcon name="check" size={14} color={colors.white} /> : null}
        </View>
        <View style={styles.checkCopy}>
          <Text style={styles.checkTitle}>Agregar pagos parciales</Text>
          <Muted>Vuelos, hotel y actividades</Muted>
        </View>
      </Pressable>
      <Card tone="soft">
        <Muted>La vista previa usa el recorrido de ejemplo. La cuota definitiva saldrá del motor.</Muted>
      </Card>
      <Button
        label="Calcular mi ruta"
        onPress={() => {
          demo.setGoalDraft({ name, total, saved, deadline, frequency, partials });
          router.push('/vista-previa');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.ink,
    fontWeight: '700',
  },
  check: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: colors.primary,
  },
  checkCopy: {
    flex: 1,
    gap: 2,
  },
  checkTitle: {
    color: colors.ink,
    fontWeight: '800',
  },
});
