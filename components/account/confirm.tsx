import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { LoadError, LoadingScreen, useFinance, useMaskedMoney } from '@/components/account/mode';
import { PendingDeletionBanner } from '@/components/account/undo-banner';
import { useMovementDraft } from '@/components/movement-draft';
import { Amount, Button, Card, Header, Muted, Screen } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';
import { longDate } from '@/src/movements/period';
import { validateMovementInput } from '@/src/movements/validation';
import { createMovement, rememberAccount } from '@/src/persistence/movement-repository';

export function AccountConfirm() {
  const { finance, error, loading, reload } = useFinance();
  const { draft, revision, resetDraft } = useMovementDraft();
  const money = useMaskedMoney();
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const [savedRevision, setSavedRevision] = useState<number | null>(null);

  if (loading && !finance) {
    return (
      <LoadingScreen title="Confirmar">
        <PendingDeletionBanner />
      </LoadingScreen>
    );
  }
  if ((error && !finance) || !finance) {
    return (
      <LoadError title="Confirmar" message={error || 'No se pudo preparar la confirmación.'} onRetry={() => void reload()}>
        <PendingDeletionBanner />
      </LoadError>
    );
  }

  let parsed: ReturnType<typeof validateMovementInput> | null = null;
  let validationError = '';
  try {
    parsed = validateMovementInput(draft);
  } catch (caught) {
    validationError = caught instanceof Error ? caught.message : 'Revisa los datos.';
  }
  const category = finance.categories.find((item) => item.id === parsed?.categoryId);
  const account = finance.accounts.find((item) => item.id === parsed?.accountId);

  async function confirm() {
    if (!parsed) {
      setFormError(validationError);
      return;
    }
    setFormError('');
    setPending(true);
    try {
      if (savedRevision !== revision) {
        await createMovement(parsed);
        setSavedRevision(revision);
      }
      await rememberAccount(parsed.accountId);
      resetDraft();
      router.replace('/inicio');
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'No se pudo guardar el movimiento.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen>
      <Header title={draft.kind === 'gasto' ? 'Confirmar gasto' : 'Confirmar ingreso'} fallback="/registrar" />
      <PendingDeletionBanner />
      {parsed && category && account ? (
        <Card>
          <Text style={styles.name}>{parsed.note || category.name}</Text>
          <Amount>{money(parsed.amount)}</Amount>
          <Muted>
            {category.name} · {longDate(parsed.occurredOn)} · {account.name}
          </Muted>
        </Card>
      ) : (
        <Card tone="yellow">
          <Text>{validationError || 'Falta algún dato del movimiento.'}</Text>
        </Card>
      )}
      {formError ? (
        <Card tone="yellow">
          <Text>{formError}</Text>
        </Card>
      ) : null}
      <Button label="Confirmar y guardar" disabled={pending || !parsed} onPress={() => void confirm()} />
      <Button label="Volver a editar" variant="secondary" onPress={() => router.push('/registrar')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
});
