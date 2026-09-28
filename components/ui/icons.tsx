import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Feather>['name'];

export function AppIcon({
  name,
  color = '#1A2F2A',
  size = 20,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  return <Feather name={name} size={size} color={color} />;
}
