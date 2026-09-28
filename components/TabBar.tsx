import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type IconName } from '@/components/ui/icons';
import { colors } from '@/components/ui/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const tabs: { name: string; label: string; icon: IconName }[] = [
  { name: 'inicio', label: 'Inicio', icon: 'home' },
  { name: 'movimientos', label: 'Movimientos', icon: 'list' },
  { name: 'metas', label: 'Metas', icon: 'target' },
  { name: 'calendario', label: 'Calendario', icon: 'calendar' },
];

const groups: Record<string, string> = {
  inicio: 'inicio',
  resumen: 'inicio',
  perfil: 'inicio',
  presupuestos: 'inicio',
  movimientos: 'movimientos',
  registrar: 'movimientos',
  voz: 'movimientos',
  confirmar: 'movimientos',
  corregir: 'movimientos',
  metas: 'metas',
  'nueva-meta': 'metas',
  'vista-previa': 'metas',
  'detalle-meta': 'metas',
  reajustar: 'metas',
  calendario: 'calendario',
  suscripciones: 'calendario',
};

export function AhorrutaTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name ?? 'inicio';
  const active = groups[current] ?? 'inicio';

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <Text style={styles.demo}>Demostración local. No se guarda en tu cuenta.</Text>
      {tabs.map((tab) => {
        const selected = active === tab.name;
        const route = state.routes.find((item: { name: string }) => item.name === tab.name);
        return (
          <Pressable
            key={tab.name}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
            onPress={() => {
              if (!route) {
                return;
              }
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!selected && !event.defaultPrevented) {
                navigation.navigate(tab.name as never);
              }
            }}
            style={styles.item}
          >
            <AppIcon name={tab.icon} size={20} color={selected ? colors.primary : colors.muted} />
            <Text style={[styles.label, selected && styles.labelSelected]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FBF9F4',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  demo: {
    width: '100%',
    textAlign: 'center',
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    paddingBottom: 6,
  },
});
