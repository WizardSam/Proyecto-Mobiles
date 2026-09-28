import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { useDemo } from '@/components/demo-state';
import {
  accounts,
  fortnightModes,
  frequencies,
  weekdays,
  type AccountName,
  type FortnightMode,
  type IncomeFrequency,
  type Weekday,
} from '@/constants/demo';
import { Button, Card, ChoiceRow, Field, Header, Muted, Screen, SectionTitle } from '@/components/ui/primitives';

export default function SetupScreen() {
  const demo = useDemo();
  const [frequency, setFrequency] = useState<IncomeFrequency>(demo.setup.frequency);
  const [fortnightMode, setFortnightMode] = useState<FortnightMode>(demo.setup.fortnightMode);
  const [weekday, setWeekday] = useState<Weekday>(demo.setup.weekday);
  const [anchorDate, setAnchorDate] = useState(demo.setup.anchorDate);
  const [income, setIncome] = useState(demo.setup.income);
  const [estimatedExpense, setEstimatedExpense] = useState(demo.setup.estimatedExpense);
  const [balances, setBalances] = useState(demo.setup.balances);

  function updateBalance(account: AccountName, value: string) {
    setBalances((current) => ({ ...current, [account]: value }));
  }

  return (
    <Screen withBottomInset>
      <Header title="Primeros pasos" fallback="/" />
      <Card tone="yellow">
        <Text style={{ fontWeight: '800' }}>Demostración local</Text>
        <Muted>Estos datos no se guardan en una cuenta y no se copian si después entras con tu correo.</Muted>
      </Card>
      <Muted>Usaremos estos datos para las estimaciones del prototipo. La moneda del MVP es MXN.</Muted>
      <Card tone="soft">
        <Text>Pesos mexicanos (MXN)</Text>
        <Muted>Zona horaria: America/Mexico_City</Muted>
      </Card>
      <SectionTitle>¿Cada cuándo recibes ingresos?</SectionTitle>
      <ChoiceRow options={frequencies} value={frequency} onChange={setFrequency} />
      {frequency === 'Quincenal' ? (
        <>
          <Muted>Elige cómo se forman tus quincenas.</Muted>
          <ChoiceRow options={fortnightModes} value={fortnightMode} onChange={setFortnightMode} />
          {fortnightMode === 'Cada 14 días' ? (
            <Field label="Primera fecha" value={anchorDate} onChangeText={setAnchorDate} />
          ) : null}
        </>
      ) : null}
      {frequency === 'Semanal' ? (
        <>
          <Muted>Día habitual de ingreso.</Muted>
          <ChoiceRow options={weekdays} value={weekday} onChange={setWeekday} />
        </>
      ) : null}
      <Field label="Ingreso esperado" value={income} onChangeText={setIncome} />
      <Field label="Gasto total estimado" value={estimatedExpense} onChangeText={setEstimatedExpense} />
      <SectionTitle>Saldos iniciales, opcionales</SectionTitle>
      <Muted>Cuentas administrativas: efectivo, débito y ahorro.</Muted>
      {accounts.map((account) => (
        <Field
          key={account}
          label={account}
          value={balances[account]}
          onChangeText={(value) => updateBalance(account, value)}
          placeholder="Opcional"
        />
      ))}
      <Card tone="mint">
        <Text style={{ fontWeight: '800' }}>Estas cantidades no provienen de tu banco.</Text>
        <Muted>Puedes corregirlas cuando quieras.</Muted>
      </Card>
      <Button
        label="Guardar y continuar"
        onPress={() => {
          demo.saveSetup({
            frequency,
            fortnightMode,
            weekday,
            anchorDate,
            income,
            estimatedExpense,
            balances,
          });
          router.replace('/inicio');
        }}
      />
      <Button
        label="Omitir por ahora"
        variant="secondary"
        onPress={() => {
          demo.skipSetup();
          router.replace('/inicio');
        }}
      />
    </Screen>
  );
}
