import { MoneyError, toCents, type Cents } from '../money';

const SAFE_MAX = BigInt(Number.MAX_SAFE_INTEGER);
const SAFE_MIN = -SAFE_MAX;
const INTEGER_TEXT = /^-?\d+$/;

/**
 * PostgREST devuelve bigint como número JSON.
 * También se acepta el mismo entero en texto, que es la forma exacta de PostgreSQL.
 * Ambos tienen que caber en el rango de src/money.ts.
 */
export function centsFromDatabase(value: unknown, options?: { allowNegative?: boolean }): Cents {
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new MoneyError('invalid', 'La cantidad de la base debe ser un entero.');
    }
    return toCents(value, options);
  }

  if (typeof value !== 'string' || !INTEGER_TEXT.test(value)) {
    throw new MoneyError('invalid', 'La cantidad de la base debe ser un entero.');
  }

  const parsed = BigInt(value);
  if (parsed < SAFE_MIN || parsed > SAFE_MAX) {
    throw new MoneyError('unsafe', 'La cantidad debe ser un entero de centavos dentro del rango seguro.');
  }

  return toCents(Number(parsed), options);
}

export function optionalCentsFromDatabase(
  value: unknown,
  options?: { allowNegative?: boolean },
): Cents | null {
  if (value === null || value === undefined) {
    return null;
  }
  return centsFromDatabase(value, options);
}

export function centsToDatabase(amount: Cents): string {
  return String(amount);
}
