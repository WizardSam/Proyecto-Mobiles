import assert from 'node:assert/strict';
import test from 'node:test';

import { MoneyError, toCents } from '../money';
import { centsFromDatabase, centsToDatabase, optionalCentsFromDatabase } from './database-cents';

test('convierte un bigint textual al rango seguro', () => {
  assert.equal(centsFromDatabase('125050'), 125050);
  assert.equal(centsFromDatabase(String(Number.MAX_SAFE_INTEGER)), Number.MAX_SAFE_INTEGER);
  assert.equal(centsToDatabase(toCents(125050)), '125050');
});

test('acepta saldo inicial negativo dentro del rango', () => {
  assert.equal(centsFromDatabase('-250', { allowNegative: true }), -250);
  assert.equal(centsFromDatabase(String(-Number.MAX_SAFE_INTEGER), { allowNegative: true }), -Number.MAX_SAFE_INTEGER);
});

test('acepta el entero que PostgREST devuelve como número JSON', () => {
  assert.equal(centsFromDatabase(125050), 125050);
  assert.equal(centsFromDatabase(0), 0);
  assert.equal(centsFromDatabase(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
  assert.equal(centsFromDatabase(-250, { allowNegative: true }), -250);
});

test('rechaza texto que no es un entero y números que no son enteros', () => {
  for (const value of ['12.5', '1e2', ' 12', '+12', '', '12 ', null, undefined, 12.5, Number.NaN]) {
    assert.throws(() => centsFromDatabase(value), MoneyError);
  }
});

test('rechaza un número JSON que ya no cabe en el entero seguro', () => {
  assert.throws(() => centsFromDatabase(Number.MAX_SAFE_INTEGER + 2), (error: unknown) => {
    return error instanceof MoneyError && error.code === 'unsafe';
  });
});

test('rechaza cantidades fuera del entero seguro', () => {
  const above = (BigInt(Number.MAX_SAFE_INTEGER) + 1n).toString();
  const below = (BigInt(-Number.MAX_SAFE_INTEGER) - 1n).toString();
  assert.throws(() => centsFromDatabase(above), (error: unknown) => {
    return error instanceof MoneyError && error.code === 'unsafe';
  });
  assert.throws(() => centsFromDatabase(below, { allowNegative: true }), (error: unknown) => {
    return error instanceof MoneyError && error.code === 'unsafe';
  });
  assert.throws(() => centsFromDatabase('-1'), (error: unknown) => {
    return error instanceof MoneyError && error.code === 'negative';
  });
});

test('un centavo ausente permanece ausente', () => {
  assert.equal(optionalCentsFromDatabase(null), null);
  assert.equal(optionalCentsFromDatabase('40'), 40);
});
