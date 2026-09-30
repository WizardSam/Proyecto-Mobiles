import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { IdChoices } from '@/components/account/id-choices';
import { LoadError, LoadingScreen, useFinance } from '@/components/account/mode';
import { PendingDeletionBanner } from '@/components/account/undo-banner';
import { useMovementDraft } from '@/components/movement-draft';
import { Button, Card, ChoiceRow, Field, Header, Muted, Screen } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';
import { createCategory } from '@/src/persistence/category-repository';
import type { FinanceData } from '@/src/persistence/finance';
import { sameKindCategory, selectableAccounts, validateMovementInput, type MovementInput, type MovementKindInput } from '@/src/movements/validation';

const kinds = ['Gasto', 'Ingreso'] as const;

function initialAccountId(draft: MovementInput, finance: FinanceData): string {
  if (draft.accountId.length > 0) {
    return draft.accountId;
  }
  const last = finance.accounts.find((account) => account.id === finance.lastAccountId && account.active);
  return last?.id ?? '';
}

export function AccountRegister() {
  const { finance, error, loading, reload } = useFinance();
  const { draft, revision, replaceDraft } = useMovementDraft();

  if (loading && !finance) {
    return (
      <LoadingScreen title="Registrar movimiento">
        <PendingDeletionBanner />
      </LoadingScreen>
    );
  }
  if ((error && !finance) || !finance) {
    return (
      <LoadError
        title="Registrar movimiento"
        message={error || 'No se pudo preparar el formulario.'}
        onRetry={() => void reload()}
      >
        <PendingDeletionBanner />
      </LoadError>
    );
  }

  return (
    <RegisterForm
      key={revision}
      finance={finance}
      draft={draft}
      replaceDraft={replaceDraft}
      reload={reload}
    />
  );
}

function RegisterForm({
  finance,
  draft,
  replaceDraft,
  reload,
}: {
  finance: FinanceData;
  draft: MovementInput;
  replaceDraft: (next: MovementInput) => void;
  reload: () => Promise<void>;
}) {
  const [kind, setKind] = useState<MovementKindInput>(draft.kind);
  const [amount, setAmount] = useState(draft.amount);
  const [categoryId, setCategoryId] = useState(draft.categoryId);
  const [accountId, setAccountId] = useState(initialAccountId(draft, finance));
  const [date, setDate] = useState(draft.date);
  const [note, setNote] = useState(draft.note);
  const [newCategory, setNewCategory] = useState('');
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const accounts = selectableAccounts(finance.accounts, null);
  const archivedAccounts = finance.accounts.filter((account) => !account.active);
  const categories = sameKindCategory(finance.categories, kind, null);

  function changeKind(next: MovementKindInput) {
    setKind(next);
    const allowed = sameKindCategory(finance.categories, next, null);
    if (!allowed.some((category) => category.id === categoryId)) {
      setCategoryId('');
    }
  }

  async function addCategory() {
    setFormError('');
    setPending(true);
    try {
      const created = await createCategory(kind, newCategory);
      setNewCategory('');
      setCategoryId(created.id);
      await reload();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'No se pudo crear la categoría.');
    } finally {
      setPending(false);
    }
  }

  function continueToConfirm() {
    setFormError('');
    try {
      validateMovementInput({ kind, amount, categoryId, accountId, date, note });
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Revisa los datos.');
      return;
    }
    replaceDraft({ kind, amount, categoryId, accountId, date, note });
    router.push('/confirmar');
  }

  return (
    <Screen>
      <Header title="Registrar movimiento" fallback="/movimientos" />
      <PendingDeletionBanner />
      {accounts.length === 0 ? (
        <Card tone="yellow">
          <Text style={styles.title}>{archivedAccounts.length > 0 ? 'Falta una cuenta activa' : 'Falta una cuenta'}</Text>
          <Muted>
            {archivedAccounts.length > 0
              ? 'Todas tus cuentas están archivadas. Reactiva una en Mi cuenta para registrar un movimiento.'
              : 'Registra efectivo, débito o ahorro en Mi cuenta antes del primer movimiento.'}
          </Muted>
          <Button label="Ir a Mi cuenta" variant="secondary" onPress={() => router.push('/cuenta')} />
        </Card>
      ) : (
        <>
          <ChoiceRow
            options={kinds}
            value={kind === 'gasto' ? 'Gasto' : 'Ingreso'}
            onChange={(value) => changeKind(value === 'Gasto' ? 'gasto' : 'ingreso')}
          />
          <Field label="Cantidad" value={amount} onChangeText={setAmount} placeholder="$0.00" />
          <Text style={styles.label}>Categoría</Text>
          {categories.length === 0 ? (
            <Muted>No hay categorías activas de este tipo. Crea una para continuar.</Muted>
          ) : (
            <IdChoices
              options={categories.map((category) => ({ id: category.id, label: category.name }))}
              value={categoryId}
              onChange={setCategoryId}
            />
          )}
          <Field label="Nueva categoría" value={newCategory} onChangeText={setNewCategory} placeholder="Nombre" />
          <Button label="Agregar categoría" variant="secondary" disabled={pending} onPress={() => void addCategory()} />
          <Field label="Fecha" value={date} onChangeText={setDate} placeholder="AAAA-MM-DD" autoCapitalize="none" />
          <Text style={styles.label}>Cuenta</Text>
          <IdChoices
            options={accounts.map((account) => ({ id: account.id, label: account.name }))}
            value={accountId}
            onChange={setAccountId}
          />
          <Field label="Nota" value={note} onChangeText={setNote} placeholder="Opcional" />
          {formError ? (
            <Card tone="yellow">
              <Text>{formError}</Text>
            </Card>
          ) : null}
          <Button label="Administrar categorías" variant="secondary" onPress={() => router.push('/categorias' as Href)} />
          <Button label={kind === 'gasto' ? 'Revisar gasto' : 'Revisar ingreso'} disabled={pending} onPress={continueToConfirm} />
        </>
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
  label: {
    color: colors.ink,
    fontWeight: '700',
  },
});
