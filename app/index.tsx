import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { RouteArt } from '@/components/RouteArt';
import { Button, Card, Screen } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';

export default function WelcomeScreen() {
  return (
    <Screen withBottomInset>
      <View style={styles.brand}>
        <Text style={styles.logo}>Ahorruta</Text>
        <Text style={styles.slogan}>Tu dinero, con destino.</Text>
        <Text style={styles.copy}>Organiza tus gastos y convierte tus metas en un plan sencillo.</Text>
      </View>
      <RouteArt />
      <Card tone="mint">
        <Text style={styles.bank}>Sin conectar tu banco</Text>
      </Card>
      <Card tone="soft">
        <Text style={styles.demoTitle}>Demostración local</Text>
        <Text style={styles.demoCopy}>
          El recorrido de Cancún vive solo en este dispositivo. No inicia sesión y no se copia a una cuenta real.
        </Text>
      </Card>
      <Button label="Comenzar" icon="arrow-right" onPress={() => router.push('/configuracion')} />
      <Button label="Entrar a mi cuenta" variant="secondary" onPress={() => router.push('/entrar' as Href)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    gap: 8,
    paddingTop: 12,
  },
  logo: {
    color: colors.primary,
    fontSize: 42,
    fontWeight: '800',
  },
  slogan: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '700',
  },
  copy: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
  },
  bank: {
    color: colors.primary,
    fontWeight: '800',
    textAlign: 'center',
  },
  demoTitle: {
    color: colors.ink,
    fontWeight: '800',
  },
  demoCopy: {
    color: colors.muted,
    lineHeight: 20,
  },
});
