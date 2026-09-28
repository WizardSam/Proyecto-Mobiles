import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const demoFiles = ['components/demo-state.tsx', 'constants/demo.ts'];

for (const file of demoFiles) {
  test(`${file} permanece aislado de la cuenta real`, () => {
    const source = readFileSync(file, 'utf8');
    assert.equal(/from\s+['"][^'"]*supabase/.test(source), false);
    assert.equal(/from\s+['"][^'"]*persistence/.test(source), false);
  });
}
