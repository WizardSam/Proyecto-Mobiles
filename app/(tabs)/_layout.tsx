import { AhorrutaTabBar } from '@/components/TabBar';
import { Tabs } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'inicio',
};

export default function TabLayout() {
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
