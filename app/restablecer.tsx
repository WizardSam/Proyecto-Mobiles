import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { useSession } from '@/components/session-state';
import { Button, Card, Field, Header, Muted, Screen } from '@/components/ui/primitives';
import { authMessage } from '@/src/persistence/auth-messages';
import { getSupabase } from '@/src/persistence/supabase-client';

export default function ResetPasswordScreen() {
  const { configured, session } = useSession();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  async function save() {
    setMessage('');
    if (password !== repeat) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }
    setPending(true);
    const { error } = await getSupabase().auth.updateUser({ password });
    setPending(false);
    if (error) {
      setMessage(authMessage(error));
      return;
    }
    router.replace('/cuenta' as Href);
  }

  return (
    <Screen withBottomInset>
      <Header title="Nueva contraseña" fallback="/entrar" />
      {!session ? (
        <Card tone="yellow">
          <Text>Abre el enlace del correo en este dispositivo para continuar.</Text>
        </Card>
      ) : (
        <>
          <Muted>Elige una contraseña de al menos 6 caracteres.</Muted>
          <Field label="Nueva contraseña" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
          <Field label="Repite la contraseña" value={repeat} onChangeText={setRepeat} secureTextEntry autoCapitalize="none" />
          {message ? (
            <Card tone="yellow">
              <Text>{message}</Text>
            </Card>
          ) : null}
          <Button label="Guardar contraseña" disabled={!configured || pending || password.length < 6} onPress={save} />
        </>
      )}
    </Screen>
  );
}
