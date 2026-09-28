import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { useSession } from '@/components/session-state';
import { Button, Card, Field, Header, Muted, Screen } from '@/components/ui/primitives';
import { authMessage } from '@/src/persistence/auth-messages';
import { getSupabase } from '@/src/persistence/supabase-client';

export default function SignUpScreen() {
  const { configured } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function signUp() {
    setMessage('');
    if (password !== repeat) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }
    setPending(true);
    const { error } = await getSupabase().auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: 'ahorruta://correo-confirmado' },
    });
    setPending(false);
    if (error) {
      setMessage(authMessage(error));
      return;
    }
    setSent(true);
  }

  return (
    <Screen withBottomInset>
      <Header title="Crear cuenta" fallback="/" />
      <Muted>Después de confirmar el correo podrás guardar tu información. La demostración no se copia a esta cuenta.</Muted>
      {sent ? (
        <Card tone="mint">
          <Text style={{ fontWeight: '800' }}>Revisa tu correo</Text>
          <Muted>
            Te enviamos un enlace para confirmar la cuenta. Hasta entonces no se guarda información financiera. En el
            entorno local, el mensaje aparece en la bandeja de Supabase.
          </Muted>
          <Button label="Ir a entrar" onPress={() => router.replace('/entrar' as Href)} />
        </Card>
      ) : (
        <>
          <Field
            label="Correo"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="tu@correo.com"
          />
          <Field
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Mínimo 6 caracteres"
          />
          <Field
            label="Repite la contraseña"
            value={repeat}
            onChangeText={setRepeat}
            secureTextEntry
            autoCapitalize="none"
          />
          {message ? (
            <Card tone="yellow">
              <Text>{message}</Text>
            </Card>
          ) : null}
          <Button
            label="Crear cuenta"
            disabled={!configured || pending || email.trim().length === 0 || password.length < 6}
            onPress={signUp}
          />
        </>
      )}
    </Screen>
  );
}
