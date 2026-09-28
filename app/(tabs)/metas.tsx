import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDemo } from '@/components/demo-state';
import { AppIcon } from '@/components/ui/icons';
import { Button, Card, Chip, Muted, ProgressBar, Screen, SectionTitle } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';
import { cancun, emergency, maskMoney } from '@/constants/demo';

export default function GoalsScreen() {
  const demo = useDemo();
  const money = (value: string) => maskMoney(value, demo.hideAmounts);
  const route = demo.goalRoute;

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mis metas</Text>
          <Muted>Tu ruta, con el ejemplo de Cancún.</Muted>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
          onPress={() => router.push('/perfil')}
          style={styles.avatar}
        >
          <AppIcon name="user" color={colors.primary} />
        </Pressable>
      </View>
      <Card>
        <View style={styles.row}>
          <View style={styles.main}>
            <Text style={styles.goal}>{cancun.name}</Text>
            <Muted>
              {money(cancun.saved)} de {money(route.target)}
            </Muted>
          </View>
          <Text style={styles.percent}>{cancun.percentLabel}</Text>
        </View>
        <ProgressBar percent={cancun.percent} />
        <Muted>
          Próxima aportación: {money(route.nextAmount)} · {route.nextDate}
        </Muted>
        <Chip icon="target" label={route.status} />
        <Button label="Ver mi ruta" variant="secondary" onPress={() => router.push('/detalle-meta')} />
      </Card>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/detalle-meta', params: { meta: 'emergencia' } })}>
        <Card>
          <View style={styles.row}>
            <View style={styles.main}>
              <Text style={styles.goal}>{emergency.name}</Text>
              <Muted>
                {money(emergency.saved)} de {money(emergency.target)}
              </Muted>
            </View>
            <Text style={styles.percent}>{emergency.percentLabel}</Text>
          </View>
          <ProgressBar percent={emergency.percent} />
          <Chip icon="target" label={emergency.status} />
        </Card>
      </Pressable>
      <SectionTitle>Nueva ruta</SectionTitle>
      <Button label="Nueva meta" icon="plus" onPress={() => router.push('/nueva-meta')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  main: {
    flex: 1,
    gap: 4,
  },
  goal: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  percent: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '800',
  },
});
