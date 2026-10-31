// Local agent entrypoint only. Normal npm build/start and deployment remain unchanged.
import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '..'));

export function assertIdle(repo, run = spawnSync) {
  const inspect = (command, args, allowEmpty = false) => {
    const result = run(command, args, { encoding: 'utf8' });
    if (result.error || result.signal || (result.status !== 0 && !(allowEmpty && result.status === 1 && !result.stdout && !result.stderr))) {
      throw new Error(`Cannot verify exclusive build access (${command}); stop and inspect manually.`);
    }
    return result.stdout || '';
  };
  for (const port of [3000, 3100]) {
    if (inspect('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], true).trim()) {
      throw new Error(`Port ${port} has a listener; do not build/start or stop another owner's process.`);
    }
  }
  // Inspect arguments internally to detect Next before it binds a port; never print command lines.
  const processes = inspect('ps', ['-axo', 'pid=,args=']);
  for (const line of processes.split('\n')) {
    const match = line.match(/^\s*(\d+)\s+(.*)$/);
    if (!match || !/(?:\bnext-server\b|(?:^|[ /])next(?:\s|$|\/dist\/bin\/next))/.test(match[2])) continue;
    const cwd = inspect('lsof', ['-a', '-p', match[1], '-d', 'cwd', '-Fn']);
    const path = cwd.split('\n').find((entry) => entry.startsWith('n'))?.slice(1);
    if (!path) throw new Error(`Cannot determine Next process ${match[1]} working directory; stop.`);
    if (realpathSync(path) === realpathSync(repo)) {
      throw new Error(`Next process ${match[1]} uses this checkout; do not share .next.`);
    }
  }
}

export function gate(mode, { repo = root, check = assertIdle, launch = spawnSync } = {}) {
  if (!['check', 'build', 'start'].includes(mode)) throw new Error('Usage: node scripts/agent-gate.mjs check|build|start');
  check(repo);
  if (mode === 'check') return 0;
  const args = [resolve(repo, 'node_modules/next/dist/bin/next'), mode];
  if (mode === 'start') args.push('-p', '3100');
  const result = launch(process.execPath, args, { cwd: repo, stdio: 'inherit', env: process.env });
  if (result.error || result.signal) throw new Error('Agent command failed or was interrupted.');
  return result.status ?? 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new Error('Exactly one mode is required: check|build|start');
    process.exitCode = gate(process.argv[2]);
  } catch (error) {
    console.error(`Agent gate STOP: ${error.message}`);
    process.exitCode = 1;
  }
}
