import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  addCents,
  compareCents,
  distributeCents,
  formatPesos,
  MoneyError,
  parsePesos,
  subtractCents,
  toCents,
} from './money';

describe('pesos y centavos', () => {
  it('convierte pesos con separadores a centavos enteros', () => {
    assert.equal(parsePesos('$1,250.50'), 125_050);
    assert.equal(parsePesos('1250.5'), 125_050);
    assert.equal(parsePesos('0.01'), 1);
    assert.equal(parsePesos('0.1'), 10);
    assert.equal(parsePesos('$0'), 0);
  });

  it('suma centavos sin arrastrar el error de 0.1 + 0.2', () => {
    const sum = addCents(parsePesos('0.10'), parsePesos('0.20'));
    assert.equal(sum, 30);
    assert.equal(formatPesos(sum), '$0.30');
  });

  it('resta y compara cantidades enteras', () => {
    const left = parsePesos('$10.00');
    const right = parsePesos('$3.50');
    assert.equal(subtractCents(left, right), 650);
    assert.equal(compareCents(left, right), 1);
    assert.equal(compareCents(right, left), -1);
    assert.equal(compareCents(left, left), 0);
  });

  it('muestra pesos mexicanos con dos decimales', () => {
    assert.equal(formatPesos(parsePesos('1250')), '$1,250.00');
    assert.equal(formatPesos(parsePesos('$350.50')), '$350.50');
    assert.equal(formatPesos(toCents(-150, { allowNegative: true })), '-$1.50');
  });

  it('rechaza cantidades inválidas, negativas y fuera de rango', () => {
    assert.throws(() => parsePesos(''), MoneyError);
    assert.throws(() => parsePesos('abc'), MoneyError);
    assert.throws(() => parsePesos('1.234'), MoneyError);
    assert.throws(() => parsePesos('1,25'), MoneyError);
    assert.throws(() => parsePesos('-1.00'), (error: unknown) => error instanceof MoneyError && error.code === 'negative');
    assert.equal(parsePesos('-1.00', { allowNegative: true }), -100);
    assert.throws(() => toCents(1.5), (error: unknown) => error instanceof MoneyError && error.code === 'unsafe');
    assert.throws(() => toCents(-1), (error: unknown) => error instanceof MoneyError && error.code === 'negative');
    assert.throws(
      () => parsePesos('90071992547409.92'),
      (error: unknown) => error instanceof MoneyError && error.code === 'unsafe',
    );
    assert.equal(parsePesos('90071992547409.91'), Number.MAX_SAFE_INTEGER);
    assert.throws(
      () => addCents(toCents(Number.MAX_SAFE_INTEGER), toCents(1)),
      (error: unknown) => error instanceof MoneyError && error.code === 'unsafe',
    );
  });

  it('entrega los centavos sobrantes a las primeras posiciones', () => {
    assert.deepEqual(distributeCents(toCents(100), 3), [34, 33, 33]);
    assert.deepEqual(distributeCents(toCents(10), 3), [4, 3, 3]);
    assert.deepEqual(distributeCents(toCents(2), 5), [1, 1, 0, 0, 0]);
    assert.deepEqual(distributeCents(toCents(0), 4), [0, 0, 0, 0]);
    const shares = distributeCents(parsePesos('$10.00'), 6);
    assert.equal(
      shares.reduce((sum, share) => sum + share, 0),
      1000,
    );
    assert.throws(() => distributeCents(toCents(10), 0), MoneyError);
    assert.throws(() => distributeCents(toCents(-1, { allowNegative: true }), 2), MoneyError);
  });
});
