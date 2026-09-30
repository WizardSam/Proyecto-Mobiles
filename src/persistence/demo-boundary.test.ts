import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const demoFiles = ['components/demo-state.tsx', 'constants/demo.ts'];
const accountFiles = [
  'src/persistence/category-repository.ts',
  'src/persistence/movement-repository.ts',
  'src/persistence/account-repository.ts',
  'src/persistence/finance.ts',
];

for (const file of demoFiles) {
  test(`${file} permanece aislado de la cuenta real`, () => {
    const source = readFileSync(file, 'utf8');
    assert.equal(/from\s+['"][^'"]*supabase/.test(source), false);
    assert.equal(/from\s+['"][^'"]*persistence/.test(source), false);
  });
}

for (const file of accountFiles) {
  test(`${file} no importa la demostración`, () => {
    const source = readFileSync(file, 'utf8');
    assert.equal(/from\s+['"][^'"]*demo-state/.test(source), false);
    assert.equal(/from\s+['"][^'"]*constants\/demo/.test(source), false);
  });
}
