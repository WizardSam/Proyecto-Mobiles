import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useDemo } from '@/components/demo-state';
import { homeSnapshots, maskMoney, summaryCategories } from '@/constants/demo';
import { Amount, Button, Card, Header, Muted, Row, Screen, SectionTitle } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';

export default function SummaryScreen() {
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
