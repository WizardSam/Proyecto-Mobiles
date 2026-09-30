import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ConfirmEmailGate, LoadingScreen, useAccountMode } from '@/components/account/mode';
import { useDemo } from '@/components/demo-state';
import { homeSnapshots, maskMoney, summaryCategories } from '@/constants/demo';
import { Amount, Button, Card, Header, Muted, Row, Screen, SectionTitle } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';

export default function SummaryScreen() {
  const mode = useAccountMode();
  if (mode === 'loading') {
    return <LoadingScreen title="Resumen mensual" />;
  }
  if (mode === 'confirm') {
    return <ConfirmEmailGate title="Resumen mensual" />;
  }
  if (mode === 'ready') {
    return <AccountSummary />;
  }
  return <DemoSummary />;
}

function AccountSummary() {
  return (
    <Screen>
      <Header title="Resumen mensual" fallback="/inicio" />
      <Card tone="soft">
        <Text style={styles.note}>El resumen de tu cuenta llega después</Text>
        <Muted>Esta pantalla no muestra cifras de la demostración. El detalle mensual queda para un paso posterior.</Muted>
      </Card>
      <Button label="Volver a Inicio" onPress={() => router.replace('/inicio')} />
    </Screen>
  );
}

function DemoSummary() {
  const demo = useDemo();
  const money = (value: string) => maskMoney(value, demo.hideAmounts);
  const snapshot = demo.savedMovement ? homeSnapshots.afterExpense : homeSnapshots.beforeExpense;
  const categories = demo.savedMovement ? summaryCategories.after : summaryCategories.before;

  return (
    <Screen>
      <Header title="Resumen de septiembre" fallback="/inicio" />
      <View style={styles.grid}>
        <Card>
          <Muted>Ingresos</Muted>
          <Amount compact>{money(snapshot.ingresos)}</Amount>
        </Card>
        <Card>
          <Muted>Gastos</Muted>
          <Amount compact>{money(snapshot.gastos)}</Amount>
        </Card>
        <Card>
          <Muted>Metas</Muted>
          <Amount compact>{money(snapshot.metas)}</Amount>
        </Card>
      </View>
      <SectionTitle>Gastos por categoría</SectionTitle>
      <Card>
        {categories.map((item) => (
          <Row
            key={item.id}
            icon={item.icon}
            title={item.name}
            subtitle={item.share}
            value={money(item.amount)}
            onPress={() => router.push({ pathname: '/movimientos', params: { categoria: item.name } })}
          />
        ))}
      </Card>
      <Card tone="yellow">
        <Text style={styles.note}>{money('Gastaste $480 menos que en agosto')}</Text>
      </Card>
      <Card tone="mint">
        <Text style={styles.note}>Buen avance</Text>
        <Muted>Cumpliste tus aportaciones del mes.</Muted>
      </Card>
      <Button label="Ver presupuestos" onPress={() => router.push('/presupuestos')} />
      <Button label="Ver movimientos" variant="secondary" onPress={() => router.push('/movimientos')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  note: {
    color: colors.ink,
    fontWeight: '800',
  },
});
