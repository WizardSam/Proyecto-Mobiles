import { router, type Href } from 'expo-router';

import { AccountCategories } from '@/components/account/categories';
import { ConfirmEmailGate, LoadingScreen, useAccountMode } from '@/components/account/mode';
import { Button, Header, Muted, Screen } from '@/components/ui/primitives';

export default function CategoriesScreen() {
  const mode = useAccountMode();
  if (mode === 'loading') {
    return <LoadingScreen title="Categorías" />;
  }
  if (mode === 'demo') {
    return (
      <Screen>
        <Header title="Categorías" fallback="/movimientos" />
        <Muted>Entra a tu cuenta para administrar categorías. La demostración no las guarda.</Muted>
        <Button label="Entrar" onPress={() => router.push('/entrar' as Href)} />
      </Screen>
    );
  }
  if (mode === 'confirm') {
    return <ConfirmEmailGate title="Categorías" />;
  }
  return <AccountCategories />;
}
