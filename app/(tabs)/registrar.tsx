import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AccountRegister } from '@/components/account/register';
import { ConfirmEmailGate, LoadingScreen, useAccountMode } from '@/components/account/mode';
import { useDemo } from '@/components/demo-state';
import {
  expenseCategories,
  incomeCategories,
  type AccountName,
  type MovementKind,
} from '@/constants/demo';
import { accounts } from '@/constants/demo';
import { Button, ChoiceRow, Field, Header, Screen } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';

export default function RegisterScreen() {
  const mode = useAccountMode();
  if (mode === 'loading') {
    return <LoadingScreen title="Registrar movimiento" />;
  }
  if (mode === 'confirm') {
    return <ConfirmEmailGate title="Registrar movimiento" />;
  }
  if (mode === 'ready') {
    return <AccountRegister />;
  }
  return <DemoRegister />;
}

function DemoRegister() {
  const demo = useDemo();
  const categories = demo.draft.kind === 'gasto' ? expenseCategories : incomeCategories;

  function setKind(kind: MovementKind) {
    const nextCategories = kind === 'gasto' ? expenseCategories : incomeCategories;
    const category = nextCategories.includes(demo.draft.category) ? demo.draft.category : nextCategories[0];
    demo.setDraft({ kind, category });
  }

  return (
    <Screen>
      <Header title="Registrar movimiento" fallback="/inicio" />
      <View style={styles.segment}>
        <ChoiceRow
          options={['Gasto', 'Ingreso'] as const}
          value={demo.draft.kind === 'gasto' ? 'Gasto' : 'Ingreso'}
          onChange={(value) => setKind(value === 'Gasto' ? 'gasto' : 'ingreso')}
        />
      </View>
      <Field label="Cantidad" value={demo.draft.amount} onChangeText={(amount) => demo.setDraft({ amount })} />
      <Text style={styles.label}>Categoría</Text>
      <ChoiceRow options={categories} value={demo.draft.category} onChange={(category) => demo.setDraft({ category })} />
      <Field label="Fecha" value={demo.draft.date} onChangeText={(date) => demo.setDraft({ date })} />
      <Text style={styles.label}>Cuenta</Text>
      <ChoiceRow
        options={accounts}
        value={demo.draft.account}
        onChange={(account: AccountName) => demo.setDraft({ account })}
      />
      <Field label="Nota" value={demo.draft.note} onChangeText={(note) => demo.setDraft({ note })} />
      <Button label="Registrar con voz" icon="mic" variant="secondary" onPress={() => router.push('/voz')} />
      <Button label={demo.draft.kind === 'gasto' ? 'Guardar gasto' : 'Guardar ingreso'} onPress={() => router.push('/confirmar')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: {
    marginTop: 4,
  },
  label: {
    color: colors.ink,
    fontWeight: '700',
  },
});
