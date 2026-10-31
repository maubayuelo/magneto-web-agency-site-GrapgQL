import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertIdle, gate } from './agent-gate.mjs';

const repo = process.cwd();
const ok = (stdout = '') => ({ status: 0, stdout, stderr: '' });
const empty = () => ({ status: 1, stdout: '', stderr: '' });
const idle = (command) => command === 'lsof' ? empty() : ok();

test('idle checkout passes; no command launched for check', () => {
  assertIdle(repo, idle);
  assert.equal(gate('check', { check: () => {}, launch: () => assert.fail('launched') }), 0);
});
for (const port of [3000, 3100]) {
  test(`listener on ${port} prevents build and start`, () => {
    const check = () => assertIdle(repo, (command, args) => args.includes(`-iTCP:${port}`) ? ok('123\n') : idle(command));
    for (const mode of ['build', 'start']) {
      assert.throws(() => gate(mode, { check, launch: () => assert.fail('launched') }), new RegExp(`Port ${port}`));
    }
  });
}
for (const command of ['node /x/node_modules/next/dist/bin/next dev -p 3200', 'next-server (v15)', 'next build']) {
  test(`same checkout is blocked before port bind: ${command}`, () => {
    assert.throws(() => assertIdle(repo, (tool, args) => tool === 'ps' ? ok(`42 ${command}`) : args.includes('cwd') ? ok(`p42\nfcwd\nn${repo}\n`) : empty()), /uses this checkout/);
  });
}
test('Next in another checkout on a different port is allowed', () => {
  assertIdle(repo, (tool, args) => tool === 'ps' ? ok('42 next-server') : args.includes('cwd') ? ok('p42\nfcwd\nn/\n') : empty());
});
test('inspection errors and unknown cwd fail closed', () => {
  for (const result of [{ error: new Error('missing tool') }, { status: 1, stderr: 'denied' }, { status: 0, signal: 'SIGTERM' }]) {
    assert.throws(() => assertIdle(repo, () => result), /Cannot verify/);
  }
  assert.throws(() => assertIdle(repo, tool => tool === 'ps' ? { status: 1 } : empty()), /Cannot verify/);
  assert.throws(() => assertIdle(repo, (tool, args) => tool === 'ps' ? ok('42 next-server') : args.includes('cwd') ? ok() : empty()), /Cannot determine/);
});
test('approved modes launch only after check; start fixed to 3100; child failure propagates', () => {
  for (const mode of ['build', 'start']) {
    let checked = false;
    assert.equal(gate(mode, { repo, check: () => { checked = true; }, launch: (_exe, args) => {
      assert.equal(checked, true);
      assert.deepEqual(args.slice(1), mode === 'start' ? ['start', '-p', '3100'] : ['build']);
      return { status: 7 };
    } }), 7);
  }
  assert.throws(() => gate('dev', { check: () => assert.fail('checked') }), /Usage/);
});
