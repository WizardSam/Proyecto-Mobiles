declare const centsBrand: unique symbol;

/** Cantidad entera en centavos de peso mexicano. */
export type Cents = number & { readonly [centsBrand]: true };

export type MoneyErrorCode = 'invalid' | 'negative' | 'unsafe';

export class MoneyError extends Error {
  readonly code: MoneyErrorCode;

  constructor(code: MoneyErrorCode, message: string) {
    super(message);
    this.name = 'MoneyError';
    this.code = code;
  }
}

const SAFE_CENTS = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * Acepta `$1,250.50`, `1250.50` y `1250`.
 * La coma separa miles y el punto separa centavos. Más de dos decimales se rechaza.
 */
const PESOS_PATTERN = /^(-)?\$?\s*(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{1,2}))?$/;

export function toCents(value: number, options?: { allowNegative?: boolean }): Cents {
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError('unsafe', 'La cantidad debe ser un entero de centavos dentro del rango seguro.');
  }
  if (value < 0 && !options?.allowNegative) {
    throw new MoneyError('negative', 'La cantidad no puede ser negativa.');
  }
  return value as Cents;
}

export function parsePesos(input: string, options?: { allowNegative?: boolean }): Cents {
  const match = PESOS_PATTERN.exec(input.trim());
  if (!match) {
    throw new MoneyError('invalid', 'La cantidad en pesos no es válida.');
  }

  const [, sign, pesosPart, decimalPart = ''] = match;
  if (sign && !options?.allowNegative) {
    throw new MoneyError('negative', 'La cantidad no puede ser negativa.');
  }

  const pesos = BigInt(pesosPart.replaceAll(',', ''));
  const fraction = BigInt(decimalPart.padEnd(2, '0') || '0');
  const cents = pesos * 100n + fraction;
  if (cents > SAFE_CENTS) {
    throw new MoneyError('unsafe', 'La cantidad queda fuera del rango seguro.');
  }

  const signed = sign ? -cents : cents;
  return Number(signed) as Cents;
}

export function formatPesos(amount: Cents): string {
  const validated = toCents(amount, { allowNegative: true });
  const negative = validated < 0;
  const absolute = Math.abs(validated);
  const pesos = Math.floor(absolute / 100);
  const cents = absolute % 100;
  const grouped = pesos.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}$${grouped}.${cents.toString().padStart(2, '0')}`;
}

export function addCents(left: Cents, right: Cents): Cents {
  const a = toCents(left, { allowNegative: true });
  const b = toCents(right, { allowNegative: true });
  const sum = a + b;
  if (!Number.isSafeInteger(sum)) {
    throw new MoneyError('unsafe', 'La suma queda fuera del rango seguro.');
  }
  return sum as Cents;
}

export function subtractCents(minuend: Cents, subtrahend: Cents): Cents {
  const left = toCents(minuend, { allowNegative: true });
  const right = toCents(subtrahend, { allowNegative: true });
  const difference = left - right;
  if (!Number.isSafeInteger(difference)) {
    throw new MoneyError('unsafe', 'La resta queda fuera del rango seguro.');
  }
  return difference as Cents;
}

export function compareCents(left: Cents, right: Cents): -1 | 0 | 1 {
  const a = toCents(left, { allowNegative: true });
  const b = toCents(right, { allowNegative: true });
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

/**
 * Reparte `total` en `count` partes enteras.
 * Las primeras posiciones, que corresponden a las fechas más próximas, reciben los centavos sobrantes.
 */
export function distributeCents(total: Cents, count: number): Cents[] {
  const amount = toCents(total);
  if (!Number.isSafeInteger(count) || count < 1) {
    throw new MoneyError('invalid', 'Debe haber al menos una fecha para repartir.');
  }

  const base = Math.floor(amount / count);
  const remainder = amount % count;
  return Array.from({ length: count }, (_, index) => (index < remainder ? base + 1 : base) as Cents);
}
