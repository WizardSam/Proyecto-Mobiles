import { Platform } from 'react-native';

export function authRedirect(path: 'correo-confirmado' | 'restablecer'): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/${path}`;
  }
  return `ahorruta://${path}`;
}
