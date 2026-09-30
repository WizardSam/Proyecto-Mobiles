import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { LoadError, LoadingScreen, useFinance } from '@/components/account/mode';
import { PendingDeletionBanner } from '@/components/account/undo-banner';
import { Button, Card, Field, Header, Muted, Screen, SectionTitle } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';
import {
  archiveCategory,
  createCategory,
  deleteCategory,
  loadCategoryUsage,
  renameCategory,
  restoreCategory,
} from '@/src/persistence/category-repository';
import type { FinanceData } from '@/src/persistence/finance';
import { categoryName, type MovementKindInput } from '@/src/movements/validation';

const sections: { kind: MovementKindInput; title: string }[] = [
  { kind: 'ingreso', title: 'Ingresos' },
  { kind: 'gasto', title: 'Gastos' },
];

export function AccountCategories() {
  const { finance, error, loading, reload } = useFinance();
  const [usage, setUsage] = useState<Map<string, number>>(new Map());
  const [usageFor, setUsageFor] = useState<FinanceData | null>(null);
  const [usageError, setUsageError] = useState('');
  const usageRequest = useRef(0);
  const [names, setNames] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<MovementKindInput, string>>({ ingreso: '', gasto: '' });
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!finance) {
      return;
    }
    const current = usageRequest.current + 1;
    usageRequest.current = current;
    const requested = finance;
    loadCategoryUsage()
      .then((next) => {
        if (usageRequest.current !== current) {
          return;
        }
        setUsage(next);
        setUsageError('');
        setUsageFor(requested);
      })
      .catch((caught: unknown) => {
        if (usageRequest.current !== current) {
          return;
        }
        setUsageError(caught instanceof Error ? caught.message : 'No se pudo revisar el historial.');
        setUsageFor(requested);
      });
  }, [finance]);

  if (loading && !finance) {
    return (
      <LoadingScreen title="Categorías">
        <PendingDeletionBanner />
      </LoadingScreen>
    );
  }
  if ((error && !finance) || !finance) {
    return (
      <LoadError title="Categorías" message={error || 'No se pudieron leer las categorías.'} onRetry={() => void reload()}>
        <PendingDeletionBanner />
      </LoadError>
    );
  }

  const usageSettled = usageFor === finance;

  async function add(kind: MovementKindInput) {
    setMessage('');
    setPending(true);
    try {
      await createCategory(kind, drafts[kind]);
      setDrafts((current) => ({ ...current, [kind]: '' }));
      await reload();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'No se pudo crear la categoría.');
    } finally {
      setPending(false);
    }
  }

  async function rename(id: string) {
    setMessage('');
    setPending(true);
    try {
      await renameCategory(id, names[id] ?? '');
      setEditing(null);
      await reload();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'No se pudo renombrar la categoría.');
    } finally {
      setPending(false);
    }
  }

  async function archive(id: string) {
    setMessage('');
    setPending(true);
    try {
      await archiveCategory(id);
      await reload();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'No se pudo archivar la categoría.');
    } finally {
      setPending(false);
    }
  }

  async function restore(id: string) {
    setMessage('');
    setPending(true);
    try {
      await restoreCategory(id);
      await reload();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'No se pudo reactivar la categoría.');
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    setMessage('');
    setPending(true);
    try {
      await deleteCategory(id);
      await reload();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'No se pudo eliminar la categoría.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen>
      <Header title="Categorías" fallback="/movimientos" />
      <PendingDeletionBanner />
      <Muted>Una categoría con movimientos, presupuestos o compromisos se archiva. Si no tiene referencias, se puede eliminar. Una archivada se puede reactivar.</Muted>
      {!usageSettled ? <Muted>Revisando el historial…</Muted> : null}
      {usageSettled && usageError ? (
        <Card tone="yellow">
          <Text>{usageError}</Text>
        </Card>
      ) : null}
      {message ? (
        <Card tone="yellow">
          <Text>{message}</Text>
        </Card>
      ) : null}
      {sections.map((section) => (
        <Card key={section.kind}>
          <SectionTitle>{section.title}</SectionTitle>
          <Field
            label="Nueva categoría"
            value={drafts[section.kind]}
            onChangeText={(value) => setDrafts((current) => ({ ...current, [section.kind]: value }))}
            autoComplete="off"
          />
          <Button
            label="Crear"
            variant="secondary"
            disabled={pending}
            onPress={() => void add(section.kind)}
          />
          {finance.categories.some((category) => category.kind === section.kind) ? null : (
            <Muted>No hay categorías de este tipo.</Muted>
          )}
          {finance.categories
            .filter((category) => category.kind === section.kind)
            .map((category) => {
              const references = usage.get(category.id) ?? 0;
              const archived = category.archivedAt !== null;
              return (
                <Card key={category.id} tone={archived ? 'soft' : 'plain'}>
                  {editing === category.id ? (
                    <>
                      <Field
                        label="Nombre"
                        value={names[category.id] ?? category.name}
                        onChangeText={(value) => setNames((current) => ({ ...current, [category.id]: value }))}
                      />
                      <Button label="Guardar nombre" disabled={pending} onPress={() => void rename(category.id)} />
                    </>
                  ) : (
                    <Text style={styles.name}>{category.name}</Text>
                  )}
                  {archived ? (
                    <Muted>Archivada. Conserva su historial y no aparece al crear movimientos.</Muted>
                  ) : null}
                  <Button
                    label="Renombrar"
                    variant="secondary"
                    disabled={pending}
                    onPress={() => {
                      try {
                        categoryName(category.name);
                      } catch {
                        return;
                      }
                      setNames((current) => ({ ...current, [category.id]: category.name }));
                      setEditing(category.id);
                    }}
                  />
                  {archived ? (
                    <Button label="Reactivar" variant="secondary" disabled={pending} onPress={() => void restore(category.id)} />
                  ) : (
                    <Button label="Archivar" variant="secondary" disabled={pending} onPress={() => void archive(category.id)} />
                  )}
                  {usageSettled && !usageError && references === 0 ? (
                    <Button label="Eliminar" variant="secondary" disabled={pending} onPress={() => void remove(category.id)} />
                  ) : null}
                  {usageSettled && !usageError && references > 0 ? (
                    <Muted>Tiene historial, así que no se puede eliminar.</Muted>
                  ) : null}
                </Card>
              );
            })}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 16,
  },
});
