import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { useSession } from '@/components/session-state';
import { Button, Card, ChoiceRow, Field, Header, Muted, Screen, SectionTitle } from '@/components/ui/primitives';
import { parseIsoDate, formatIsoDate } from '@/src/dates';
import type { AccountKind } from '@/src/ledger';
import { formatPesos, parsePesos, type Cents } from '@/src/money';
import { loadAccounts, saveAccount } from '@/src/persistence/account-repository';
import { deleteOwnAccount } from '@/src/persistence/delete-account';
import {
  loadProfile,
  updateDisplayName,
  updateFinancialProfile,
  type IncomeFrequency,
} from '@/src/persistence/profile-repository';
import { authRedirect } from '@/src/persistence/auth-redirect';
import { getSupabase } from '@/src/persistence/supabase-client';

const frequencies = ['Semanal', 'Días 15 y último día', 'Cada 14 días', 'Mensual'] as const;
const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
const accountLabels: { kind: AccountKind; label: string }[] = [
  { kind: 'efectivo', label: 'Efectivo' },
  { kind: 'debito', label: 'Débito' },
  { kind: 'ahorro', label: 'Ahorro' },
];

const frequencyValue: Record<(typeof frequencies)[number], IncomeFrequency> = {
  Semanal: 'semanal',
  'Días 15 y último día': 'quincena-calendario',
  'Cada 14 días': 'cada-14-dias',
  Mensual: 'mensual',
};

const weekdayValue: Record<(typeof weekdays)[number], 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'> = {
  Lunes: 'lunes',
  Martes: 'martes',
  Miércoles: 'miercoles',
  Jueves: 'jueves',
  Viernes: 'viernes',
  Sábado: 'sabado',
  Domingo: 'domingo',
};

function frequencyLabel(value: IncomeFrequency | null): (typeof frequencies)[number] | null {
  if (value === 'semanal') return 'Semanal';
  if (value === 'quincena-calendario') return 'Días 15 y último día';
  if (value === 'cada-14-dias') return 'Cada 14 días';
  if (value === 'mensual') return 'Mensual';
  return null;
}

function weekdayLabel(value: string | null): (typeof weekdays)[number] {
  const match = weekdays.find((item) => weekdayValue[item] === value);
  return match ?? 'Viernes';
}

export default function AccountScreen() {
  const { configured, session } = useSession();
  const confirmed = Boolean(session?.user.email_confirmed_at || session?.user.confirmed_at);
  const [displayName, setDisplayName] = useState('');
  const [frequency, setFrequency] = useState<(typeof frequencies)[number] | null>(null);
  const [loadedKey, setLoadedKey] = useState('');
  const ready = session ? loadedKey === `${session.user.id}:${confirmed}` : false;
  const [weekday, setWeekday] = useState<(typeof weekdays)[number]>('Viernes');
  const [anchor, setAnchor] = useState('');
  const [income, setIncome] = useState('');
  const [expense, setExpense] = useState('');
  const [tracking, setTracking] = useState('');
  const [balances, setBalances] = useState<Record<AccountKind, string>>({
    efectivo: '',
    debito: '',
    ahorro: '',
  });
  const [accountIds, setAccountIds] = useState<Partial<Record<AccountKind, string>>>({});
  const [lastAccount, setLastAccount] = useState('Ninguna');
  const [password, setPassword] = useState('');
  const [phrase, setPhrase] = useState('');
  const [message, setMessage] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!session) {
      return;
    }
    let active = true;
    const key = `${session.user.id}:${confirmed}`;
    Promise.all([loadProfile(confirmed), confirmed ? loadAccounts() : Promise.resolve([])])
      .then(([profile, accounts]) => {
        if (!active) {
          return;
        }
        if (!profile) {
          setLoadedKey(key);
          return;
        }
        setDisplayName(profile.displayName);
        if (!confirmed) {
          setLoadedKey(key);
          return;
        }
        setFrequency(frequencyLabel(profile.incomeFrequency));
        setWeekday(weekdayLabel(profile.incomeWeekday));
        setAnchor(profile.incomeAnchorDate ?? '');
        setIncome(profile.expectedIncome === null ? '' : formatPesos(profile.expectedIncome));
        setExpense(profile.estimatedExpense === null ? '' : formatPesos(profile.estimatedExpense));
        setTracking(profile.trackingStartedOn ?? '');
        const nextBalances = { efectivo: '', debito: '', ahorro: '' };
        const nextIds: Partial<Record<AccountKind, string>> = {};
        for (const account of accounts) {
          nextBalances[account.kind] = formatPesos(account.openingBalance);
          nextIds[account.kind] = account.id;
          if (account.id === profile.lastAccountId) {
            setLastAccount(accountLabels.find((item) => item.kind === account.kind)?.label ?? 'Ninguna');
          }
        }
        setBalances(nextBalances);
        setAccountIds(nextIds);
        setLoadedKey(key);
      })
      .catch(() => {
        if (active) {
          setMessage('No se pudo leer tu perfil.');
        }
      });
    return () => {
      active = false;
    };
  }, [session, confirmed]);

  async function save() {
    setMessage('');
    setPending(true);
    try {
      await updateDisplayName(displayName);
      if (!confirmed) {
        setMessage('Nombre guardado. Confirma tu correo para completar el resto.');
        return;
      }
      const saved = await saveBalances();
      const money = parseOptional(income, 'El ingreso esperado no es válido.');
      const estimated = parseOptional(expense, 'El gasto estimado no es válido.');
      const anchorDate = frequency === 'Cada 14 días' ? parseDate(anchor, 'La primera fecha no es válida.') : null;
      const trackingDate = tracking.trim().length === 0 ? null : parseDate(tracking, 'La fecha de inicio no es válida.');
      const chosen = accountLabels.find((item) => item.label === lastAccount);
      if (chosen && !saved[chosen.kind]) {
        throw new Error('Escribe el saldo inicial de esa cuenta antes de usarla como la última.');
      }
      await updateFinancialProfile({
        incomeFrequency: frequency === null ? null : frequencyValue[frequency],
        incomeWeekday: frequency === 'Semanal' ? weekdayValue[weekday] : null,
        incomeAnchorDate: anchorDate,
        expectedIncome: money,
        estimatedExpense: estimated,
        trackingStartedOn: trackingDate,
        lastAccountId: chosen ? (saved[chosen.kind] ?? null) : null,
      });
      setMessage('Perfil guardado.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar.');
    } finally {
      setPending(false);
    }
  }

  async function saveBalances(): Promise<Partial<Record<AccountKind, string>>> {
    const ids = { ...accountIds };
    for (const account of accountLabels) {
      const value = balances[account.kind].trim();
      if (value.length === 0) {
        continue;
      }
      const openingBalance = parsePesos(value, { allowNegative: true });
      await saveAccount({
        id: ids[account.kind],
        kind: account.kind,
        name: account.label,
        openingBalance,
      });
    }
    const fresh = await loadAccounts();
    const nextIds: Partial<Record<AccountKind, string>> = {};
    const nextBalances = { efectivo: '', debito: '', ahorro: '' };
    for (const account of fresh) {
      nextIds[account.kind] = account.id;
      nextBalances[account.kind] = formatPesos(account.openingBalance);
    }
    setAccountIds(nextIds);
    setBalances(nextBalances);
    return nextIds;
  }

  async function resend() {
    if (!session?.user.email) {
      return;
    }
    setPending(true);
    const { error } = await getSupabase().auth.resend({
      type: 'signup',
      email: session.user.email,
      options: { emailRedirectTo: authRedirect('correo-confirmado') },
    });
    setPending(false);
    setMessage(error ? 'No se pudo reenviar el correo.' : 'Te enviamos otro enlace de confirmación.');
  }

  async function removeAccount() {
    setDeleteMessage('');
    setPending(true);
    try {
      await deleteOwnAccount(password, phrase.trim().toUpperCase());
      router.replace('/');
    } catch (error) {
      setDeleteMessage(error instanceof Error ? error.message : 'No se pudo borrar la cuenta.');
      setPending(false);
    }
  }

  if (!configured) {
    return (
      <Screen>
        <Header title="Mi cuenta" fallback="/" />
        <Card tone="yellow">
          <Text>Falta la configuración local de Supabase.</Text>
        </Card>
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <Header title="Mi cuenta" fallback="/" />
        <Muted>Entra para usar tu cuenta. La demostración de Cancún no inicia sesión.</Muted>
        <Button label="Entrar" onPress={() => router.push('/entrar' as Href)} />
      </Screen>
    );
  }

  const lastOptions = ['Ninguna', ...accountLabels.map((item) => item.label)];

  return (
    <Screen withBottomInset>
      <Header title="Mi cuenta" fallback="/" />
      <Card tone="mint">
        <Text style={{ fontWeight: '800' }}>{session.user.email}</Text>
        <Muted>Estos datos son de tu cuenta. No provienen de la demostración.</Muted>
      </Card>
      <Field label="Nombre" value={displayName} onChangeText={setDisplayName} />
      {!confirmed ? (
        <Card tone="yellow">
          <Text style={{ fontWeight: '800' }}>Confirma tu correo</Text>
          <Muted>Mientras tanto solo puedes cambiar tu nombre. No se guarda información financiera.</Muted>
          <Button label="Reenviar correo" variant="secondary" disabled={pending} onPress={resend} />
        </Card>
      ) : (
        <>
          <SectionTitle>Ingresos</SectionTitle>
          <ChoiceRow options={frequencies} value={frequency} onChange={setFrequency} />
          {frequency === 'Semanal' ? <ChoiceRow options={weekdays} value={weekday} onChange={setWeekday} /> : null}
          {frequency === 'Cada 14 días' ? (
            <Field label="Primera fecha" value={anchor} onChangeText={setAnchor} placeholder="2026-10-15" autoCapitalize="none" />
          ) : null}
          <Field label="Ingreso esperado" value={income} onChangeText={setIncome} placeholder="$0.00" />
          <Field label="Gasto total estimado" value={expense} onChangeText={setExpense} placeholder="$0.00" />
          <Field
            label="Inicio del seguimiento"
            value={tracking}
            onChangeText={setTracking}
            placeholder="2026-09-01"
            autoCapitalize="none"
          />
          <SectionTitle>Saldos iniciales</SectionTitle>
          <Muted>Efectivo, débito y ahorro. Opcionales y ajenos a la demostración.</Muted>
          {accountLabels.map((account) => (
            <Field
              key={account.kind}
              label={account.label}
              value={balances[account.kind]}
              onChangeText={(value) => setBalances((current) => ({ ...current, [account.kind]: value }))}
              placeholder="Opcional"
            />
          ))}
          <Muted>Última cuenta utilizada</Muted>
          <ChoiceRow options={lastOptions} value={lastAccount} onChange={setLastAccount} />
        </>
      )}
      {message ? (
        <Card tone="soft">
          <Text>{message}</Text>
        </Card>
      ) : null}
      <Button label="Guardar" disabled={pending || !ready} onPress={save} />
      <Button
        label="Cerrar sesión"
        variant="secondary"
        onPress={() => {
          getSupabase().auth.signOut().then(() => router.replace('/'));
        }}
      />
      <SectionTitle>Eliminar cuenta</SectionTitle>
      <Muted>Primero vuelve a escribir tu contraseña. Después escribe ELIMINAR. Esta acción borra la cuenta y sus datos.</Muted>
      <Field label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      <Field
        label="Confirmación"
        value={phrase}
        onChangeText={setPhrase}
        autoCapitalize="characters"
        placeholder="ELIMINAR"
      />
      {deleteMessage ? (
        <Card tone="yellow">
          <Text>{deleteMessage}</Text>
        </Card>
      ) : null}
      <Button
        label="Borrar mi cuenta"
        variant="secondary"
        disabled={pending || password.length === 0 || phrase.trim().toUpperCase() !== 'ELIMINAR'}
        onPress={removeAccount}
      />
    </Screen>
  );
}

function parseOptional(value: string, error: string): Cents | null {
  if (value.trim().length === 0) {
    return null;
  }
  try {
    return parsePesos(value);
  } catch {
    throw new Error(error);
  }
}

function parseDate(value: string, error: string): string {
  try {
    const date = parseIsoDate(value.trim());
    return formatIsoDate(date);
  } catch {
    throw new Error(error);
  }
}
