import { router, type Href } from 'expo-router';
import { Text } from 'react-native';

import { useSession } from '@/components/session-state';
import { Button, Card, Header, Muted, Screen } from '@/components/ui/primitives';

export default function EmailConfirmedScreen() {
  const { session } = useSession();
  const confirmed = Boolean(session?.user.email_confirmed_at || session?.user.confirmed_at);

  return (
    <Screen withBottomInset>
      <Header title="Correo" fallback="/" />
      <Card tone="mint">
        <Text style={{ fontWeight: '800' }}>{confirmed ? 'Correo confirmado' : 'Revisa tu correo'}</Text>
        <Muted>
          {confirmed
            ? 'Ya puedes completar tu perfil. La demostración de Cancún sigue siendo local y no se copió a tu cuenta.'
            : 'Cuando confirmes el enlace, podrás guardar tu información financiera.'}
        </Muted>
      </Card>
      <Button
        label={session ? 'Ir a mi cuenta' : 'Entrar'}
        onPress={() => router.replace((session ? '/cuenta' : '/entrar') as Href)}
      />
    </Screen>
  );
}
