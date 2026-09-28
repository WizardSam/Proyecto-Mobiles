import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { useSession } from '@/components/session-state';
import { Button, Card, Field, Header, Muted, Screen } from '@/components/ui/primitives';
import { colors } from '@/components/ui/theme';
import { authMessage } from '@/src/persistence/auth-messages';
import { getSupabase } from '@/src/persistence/supabase-client';

export default function SignInScreen() {
  const { configured, session } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  async function signIn() {
    setMessage('');
    setPending(true);
    const { error } = await getSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setPending(false);
    if (error) {
      setMessage(authMessage(error));
      return;
    }
    router.replace('/cuenta' as Href);
  }

  return (
    <Screen withBottomInset>
      <Header title="Entrar" fallback="/" />
      <Muted>Tu cuenta es independiente de la demostración de Cancún.</Muted>
      {!configured ? (
        <Card tone="yellow">
          <Text>Falta la configuración local de Supabase.</Text>
          <Muted>Copia la URL y la clave publicable a .env.local. No uses la clave secreta.</Muted>
        </Card>
      ) : null}
      {session ? (
        <Button label="Ir a mi cuenta" onPress={() => router.replace('/cuenta' as Href)} />
      ) : null}
      <Field
        label="Correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="tu@correo.com"
      />
      <Field label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      {message ? (
        <Card tone="yellow">
          <Text>{message}</Text>
        </Card>
      ) : null}
      <Button label="Entrar" disabled={!configured || pending || email.trim().length === 0 || password.length === 0} onPress={signIn} />
      <Button label="Olvidé mi contraseña" variant="secondary" onPress={() => router.push('/recuperar' as Href)} />
      <Pressable accessibilityRole="button" onPress={() => router.push('/crear-cuenta' as Href)}>
        <Text style={{ color: colors.primary, fontWeight: '800', textAlign: 'center' }}>Crear cuenta</Text>
      </Pressable>
    </Screen>
  );
}
