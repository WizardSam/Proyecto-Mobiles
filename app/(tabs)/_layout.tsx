import { useEffect } from 'react';
import { Tabs, usePathname } from 'expo-router';

import { AhorrutaTabBar } from '@/components/TabBar';
import { flushPendingDeletion } from '@/src/movements/pending-deletion';
import { deleteMovement } from '@/src/persistence/movement-repository';

const movementPaths = ['/movimientos', '/registrar', '/confirmar', '/corregir', '/categorias'];

function staysInMovements(pathname: string): boolean {
  return movementPaths.some((path) => pathname === path || pathname.endsWith(path));
}

export const unstable_settings = {
  initialRouteName: 'inicio',
};

export default function TabLayout() {
  const pathname = usePathname();
  useEffect(() => {
    if (!staysInMovements(pathname)) {
      flushPendingDeletion(deleteMovement);
    }
  }, [pathname]);

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AhorrutaTabBar {...props} />}>
      <Tabs.Screen name="inicio" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="movimientos" options={{ title: 'Movimientos' }} />
      <Tabs.Screen name="metas" options={{ title: 'Metas' }} />
      <Tabs.Screen name="calendario" options={{ title: 'Calendario' }} />
      <Tabs.Screen name="registrar" options={{ href: null }} />
      <Tabs.Screen name="voz" options={{ href: null }} />
      <Tabs.Screen name="confirmar" options={{ href: null }} />
      <Tabs.Screen name="corregir" options={{ href: null }} />
      <Tabs.Screen name="categorias" options={{ href: null }} />
      <Tabs.Screen name="nueva-meta" options={{ href: null }} />
      <Tabs.Screen name="vista-previa" options={{ href: null }} />
      <Tabs.Screen name="detalle-meta" options={{ href: null }} />
      <Tabs.Screen name="reajustar" options={{ href: null }} />
      <Tabs.Screen name="suscripciones" options={{ href: null }} />
      <Tabs.Screen name="resumen" options={{ href: null }} />
      <Tabs.Screen name="presupuestos" options={{ href: null }} />
      <Tabs.Screen name="perfil" options={{ href: null }} />
    </Tabs>
  );
}
