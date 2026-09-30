import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { IdChoices } from '@/components/account/id-choices';
import { LoadError, LoadingScreen, useFinance, useMaskedMoney } from '@/components/account/mode';
import { PendingDeletionBanner } from '@/components/account/undo-banner';
import { Button, Card, ChoiceRow, Field, Header, Muted, Screen } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';
import { longDate } from '@/src/movements/period';
import { startPendingDeletion } from '@/src/movements/pending-deletion';
import { formatPesos, type Cents } from '@/src/money';
import { sameKindCategory, selectableAccounts, validateMovementInput, type MovementKindInput } from '@/src/movements/validation';
import type { FinanceData } from '@/src/persistence/finance';
import { deleteMovement, rememberAccount, updateMovement, type MovementRecord } from '@/src/persistence/movement-repository';

const kinds = ['Gasto', 'Ingreso'] as const;

export function AccountCorrect() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? '';
  const { finance, error, loading, reload } = useFinance();
  const money = useMaskedMoney();
  const movement = finance?.movements.find((item) => item.id === id);

  if (loading && !finance) {
    return (
      <LoadingScreen title="Corregir movimiento">
        <PendingDeletionBanner />
      </LoadingScreen>
    );
  }
  if ((error && !finance) || !finance) {
    return (
      <LoadError title="Corregir movimiento" message={error || 'No se pudo leer el movimiento.'} onRetry={() => void reload()}>
        <PendingDeletionBanner />
      </LoadError>
    );
  }
  if (!movement) {
    return (
      <Screen>
        <Header title="Movimiento" fallback="/movimientos" />
        <PendingDeletionBanner />
        <Muted>No encontramos ese movimiento.</Muted>
      </Screen>
    );
  }

  const category = finance.categories.find((item) => item.id === movement.categoryId);
  const account = finance.accounts.find((item) => item.id === movement.accountId);

  if (movement.goalDisbursementId) {
    return (
      <Screen>
        <Header title="Pago de meta" fallback="/movimientos" />
        <PendingDeletionBanner />
        <Card>
          <Text style={styles.title}>{category?.name ?? 'Gasto'}</Text>
          <Text style={styles.amount}>{money(movement.amount)}</Text>
          <Muted>
            {longDate(movement.occurredOn)} · {account?.name ?? 'Cuenta'}
          </Muted>
        </Card>
        <Card tone="soft">
          <Text style={styles.title}>Este gasto se corrige desde la meta</Text>
          <Muted>Desde Movimientos no se edita ni se elimina. Esa operación llegará con las metas guardadas.</Muted>
        </Card>
      </Screen>
    );
  }

  return (
    <CorrectForm
      key={movement.id}
      movement={movement}
      finance={finance}
      money={money}
    />
  );
}

function CorrectForm({
  movement,
  finance,
  money,
}: {
  movement: MovementRecord;
  finance: FinanceData;
  money: (cents: Cents) => string;
}) {
  const [kind, setKind] = useState<MovementKindInput>(movement.kind);
  const [amount, setAmount] = useState(formatPesos(movement.amount));
  const [categoryId, setCategoryId] = useState(movement.categoryId);
  const [accountId, setAccountId] = useState(movement.accountId);
  const [date, setDate] = useState(movement.occurredOn);
  const [note, setNote] = useState(movement.note ?? '');
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const categories = sameKindCategory(finance.categories, kind, categoryId);
  const accounts = selectableAccounts(finance.accounts, accountId);

  function changeKind(next: MovementKindInput) {
    setKind(next);
    const allowed = sameKindCategory(finance.categories, next, null);
    if (!allowed.some((item) => item.id === categoryId)) {
      setCategoryId('');
    }
  }

  async function save() {
    setFormError('');
    setPending(true);
    try {
      const parsed = validateMovementInput({ kind, amount, categoryId, accountId, date, note });
      if (!saved) {
        await updateMovement(movement.id, parsed);
        setSaved(true);
      }
      if (parsed.accountId !== movement.accountId) {
        await rememberAccount(parsed.accountId);
      }
      router.replace('/movimientos');
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'No se pudo corregir el movimiento.');
    } finally {
      setPending(false);
    }
  }

  function remove() {
    startPendingDeletion(movement.id, deleteMovement);
    router.replace('/movimientos');
  }

  return (
    <Screen>
      <Header title="Corregir movimiento" fallback="/movimientos" />
      <PendingDeletionBanner />
      <ChoiceRow
        options={kinds}
        value={kind === 'gasto' ? 'Gasto' : 'Ingreso'}
        onChange={(value) => changeKind(value === 'Gasto' ? 'gasto' : 'ingreso')}
      />
      <Field label="Cantidad" value={amount} onChangeText={setAmount} />
      <Text style={styles.label}>Categoría</Text>
      <IdChoices
        options={categories.map((item) => ({
          id: item.id,
          label: item.archivedAt ? `${item.name} (archivada)` : item.name,
        }))}
        value={categoryId}
        onChange={setCategoryId}
      />
      <Field label="Fecha" value={date} onChangeText={setDate} autoCapitalize="none" />
      <Text style={styles.label}>Cuenta</Text>
      <IdChoices
        options={accounts.map((item) => ({
          id: item.id,
          label: item.active ? item.name : `${item.name} (archivada)`,
        }))}
        value={accountId}
        onChange={setAccountId}
      />
      <Field label="Nota" value={note} onChangeText={setNote} />
      {formError ? (
        <Card tone="yellow">
          <Text>{formError}</Text>
        </Card>
      ) : null}
      <Button label="Guardar corrección" disabled={pending} onPress={() => void save()} />
      {confirmingDelete ? (
        <Card tone="yellow">
          <Text style={styles.title}>¿Eliminar este movimiento?</Text>
          <Muted>Después podrás deshacerlo durante unos segundos.</Muted>
          <Button label="Eliminar" onPress={remove} />
          <Button label="Cancelar" variant="secondary" onPress={() => setConfirmingDelete(false)} />
        </Card>
      ) : (
        <Button label="Eliminar movimiento" variant="secondary" onPress={() => setConfirmingDelete(true)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 18,
  },
  amount: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  label: {
    color: colors.ink,
    fontWeight: '700',
  },
});
