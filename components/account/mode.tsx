import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Text } from 'react-native';

import { useDemo } from '@/components/demo-state';
import { useSession } from '@/components/session-state';
import { Button, Card, Header, Muted, Screen } from '@/components/ui/primitives';
import { maskMoney } from '@/constants/demo';
import { formatPesos, type Cents } from '@/src/money';
import { loadFinance, type FinanceData } from '@/src/persistence/finance';

export type AccountMode = 'loading' | 'demo' | 'confirm' | 'ready';

export function useAccountMode(): AccountMode {
  const { configured, ready, session } = useSession();
  if (configured && !ready) {
    return 'loading';
  }
  if (!session) {
    return 'demo';
  }
  const confirmed = Boolean(session.user.email_confirmed_at || session.user.confirmed_at);
  return confirmed ? 'ready' : 'confirm';
}

export function LoadingScreen({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Screen>
      <Header title={title} />
      {children}
      <Muted>Cargando…</Muted>
    </Screen>
  );
}

export function LoadError({
  title,
  message,
  onRetry,
  children,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  children?: ReactNode;
}) {
  return (
    <Screen>
      <Header title={title} />
      {children}
      <Card tone="yellow">
        <Text>{message}</Text>
      </Card>
      <Button label="Reintentar" onPress={onRetry} />
    </Screen>
  );
}

export function ConfirmEmailGate({ title }: { title: string }) {
  return (
    <Screen>
      <Header title={title} fallback="/" />
      <Card tone="yellow">
        <Text style={{ fontWeight: '800' }}>Confirma tu correo</Text>
        <Muted>Hasta confirmar, tus movimientos no se guardan en la cuenta.</Muted>
      </Card>
      <Button label="Ir a Mi cuenta" onPress={() => router.push('/cuenta')} />
    </Screen>
  );
}

export function useFinance() {
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setFinance(await loadFinance());
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron leer tus datos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { finance, error, loading, reload };
}

export function useMaskedMoney() {
  const demo = useDemo();
  return (cents: Cents) => maskMoney(formatPesos(cents), demo.hideAmounts);
}
