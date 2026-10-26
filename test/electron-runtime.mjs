// Test-only runtime: copy bytes, not repository ACLs or integrity labels.
// Never disable Chromium sandboxing or repair a user's directory permissions.
import { cp, mkdtemp } from 'node:fs/promises';
import { rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import installedElectron from 'electron';

let prepared;
export function prepareElectron() {
  return prepared ??= (async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'wcu-electron-runtime-'));
    const dist = path.join(root, 'dist');
    process.once('exit', () => {
      if (path.dirname(root) !== path.resolve(os.tmpdir()) || !path.basename(root).startsWith('wcu-electron-runtime-')) return;
      try { rmSync(root, { recursive: true, force: true, maxRetries: 3 }); }
      catch { console.warn(`Test Electron cleanup deferred: ${root}`); }
    });
    await cp(path.dirname(installedElectron), dist, { recursive: true });
    const executable = path.join(dist, path.basename(installedElectron));
    const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
    const probe = spawnSync(executable, ['--version'], { env, encoding: 'utf8', windowsHide: true, timeout: 15000 });
    if (probe.error || probe.status !== 0) throw new Error(`Test Electron startup failed at ${executable}: ${probe.error?.message || probe.stderr || probe.status}`);
    console.log(`Test Electron: ${executable} (${probe.stdout.trim()})`);
    return executable;
  })();
}
