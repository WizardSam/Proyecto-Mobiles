import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useDemo } from '@/components/demo-state';
import { AppIcon } from '@/components/ui/icons';
import { Button, Card, Header, Muted, Screen } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';
import { voiceDraft } from '@/constants/demo';

export default function VoiceScreen() {
  const demo = useDemo();

  function applyVoice() {
    demo.setDraft({ ...voiceDraft, account: demo.lastAccount });
  }

  return (
    <Screen>
      <Header title="Registrar con voz" fallback="/registrar" />
      <View style={styles.micWrap}>
        <View style={styles.mic}>
          <AppIcon name="mic" size={32} color={colors.white} />
        </View>
        <Text style={styles.prompt}>Cuéntame qué movimiento quieres registrar</Text>
      </View>
      <Card tone="soft">
        <Text style={styles.quote}>“Gasté $350 en gasolina ayer”</Text>
      </Card>
      <Muted>Ejemplo de transcripción. El micrófono no se usa en este prototipo.</Muted>
      <Card>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Gasto</Text>
          <Text style={styles.lineValue}>$350</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Transporte</Text>
          <Text style={styles.lineLabel}>26 de septiembre</Text>
        </View>
      </Card>
      <Button
        label="Sí, registrar"
        onPress={() => {
          applyVoice();
          router.push('/confirmar');
        }}
      />
      <Button
        label="Corregir"
        variant="secondary"
        onPress={() => {
          applyVoice();
          router.push('/registrar');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  micWrap: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  mic: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prompt: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  quote: {
    color: colors.ink,
    fontSize: 16,
    textAlign: 'center',
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  lineLabel: {
    color: colors.muted,
    fontSize: 15,
  },
  lineValue: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 18,
  },
});
