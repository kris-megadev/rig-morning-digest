import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'rig-routes-')); });
afterEach(() => rmSync(dir, { recursive: true, force: true }));
describe('digest JSON route', () => {
  it('returns sorted rows and counts malformed lines', async () => {
    writeFileSync(join(dir, '2026-10-28.jsonl'), [
      JSON.stringify({ at: '2026-10-28T02:00:00+01:00', job: 'z', status: 'fail', owner: null }),
      'not json',
      JSON.stringify({ at: '2026-10-28T01:00:00+01:00', job: 'a', status: 'ok', owner: 'lee' }),
    ].join('\n'));
    const app = createApp({ adapter: 'test', installed: '', beatEverySeconds: 60, runsDir: dir });
    const response = await app.request('/api/digest/2026-10-28');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.badLines).toBe(1);
    expect(body.rows.map((row: {job: string}) => row.job)).toEqual(['a', 'z']);
    expect(body.rows[1]).toMatchObject({owner: null, lastStatus: 'fail'});
  });
  it('returns 404 for a missing night and an empty digest for an empty file', async () => {
    const app = createApp({ adapter: 'test', installed: '', beatEverySeconds: 60, runsDir: dir });
    expect((await app.request('/api/digest/2026-10-28')).status).toBe(404);
    writeFileSync(join(dir, '2026-10-28.jsonl'), '');
    const response = await app.request('/api/digest/2026-10-28');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({rows: [], badLines: 0});
  });
});
