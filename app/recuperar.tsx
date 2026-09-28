import { useState } from 'react';
import { Text } from 'react-native';

import { useSession } from '@/components/session-state';
import { Button, Card, Field, Header, Muted, Screen } from '@/components/ui/primitives';
import { authMessage } from '@/src/persistence/auth-messages';
import { getSupabase } from '@/src/persistence/supabase-client';

export default function RecoverScreen() {
  const { configured } = useSession();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function recover() {
    setMessage('');
    setPending(true);
    const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'ahorruta://restablecer',
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
      <Header title="Recuperar contraseña" fallback="/entrar" />
      <Muted>Te enviaremos un enlace para crear una contraseña nueva.</Muted>
      {sent ? (
        <Card tone="mint">
          <Text style={{ fontWeight: '800' }}>Revisa tu correo</Text>
          <Muted>Si el correo tiene cuenta, recibirás el enlace para restablecer la contraseña.</Muted>
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
          {message ? (
            <Card tone="yellow">
              <Text>{message}</Text>
            </Card>
          ) : null}
          <Button label="Enviar enlace" disabled={!configured || pending || email.trim().length === 0} onPress={recover} />
        </>
      )}
    </Screen>
  );
}
