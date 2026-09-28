export function authMessage(error: { message?: string } | null): string {
  const message = error?.message?.toLowerCase() ?? '';
  if (message.includes('invalid login credentials')) {
    return 'El correo o la contraseña no coinciden.';
  }
  if (message.includes('email not confirmed')) {
    return 'Confirma tu correo antes de entrar.';
  }
  if (message.includes('user already registered') || message.includes('already been registered')) {
    return 'Ese correo ya tiene una cuenta.';
  }
  if (message.includes('password')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (message.includes('unable to validate email') || message.includes('invalid email')) {
    return 'Escribe un correo válido.';
  }
  return 'No se pudo completar la operación. Inténtalo de nuevo.';
}
