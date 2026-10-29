import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'rig-routes-')); });
afterEach(() => rmSync(dir, { recursive: true, force: true }));
function app() { return createApp({ adapter: 'test', installed: '', beatEverySeconds: 60, runsDir: dir }); }

describe('digest routes', () => {
  it('returns matching sorted jobs in HTML and JSON and renders bad lines', async () => {
    writeFileSync(join(dir, '2026-10-28.jsonl'), [
      JSON.stringify({ at: '2026-10-28T02:00:00+01:00', job: 'z-job', status: 'fail', owner: null }),
      'bad line',
      JSON.stringify({ at: '2026-10-28T01:00:00+01:00', job: 'a-job', status: 'ok', owner: 'lee' }),
    ].join('\n'));
    const server = app();
    const htmlResponse = await server.request('/digest/2026-10-28');
    const jsonResponse = await server.request('/api/digest/2026-10-28');
    expect(htmlResponse.status).toBe(200);
    expect(jsonResponse.status).toBe(200);
    const html = await htmlResponse.text();
    const data = await jsonResponse.json();
    expect(data.rows.map((row: { job: string }) => row.job)).toEqual(['a-job', 'z-job']);
    expect(html.indexOf('a-job')).toBeLessThan(html.indexOf('z-job'));
    expect(html).toContain('1 bad line');
    expect(html).toContain('—');
    expect(data.badLines).toBe(1);
  });
  it('returns 404 for a missing night and shows nothing ran for an empty file', async () => {
    const server = app();
    expect((await server.request('/digest/2026-10-28')).status).toBe(404);
    expect((await server.request('/api/digest/2026-10-28')).status).toBe(404);
    writeFileSync(join(dir, '2026-10-28.jsonl'), '');
    const response = await server.request('/digest/2026-10-28');
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('nothing ran');
    expect(await (await server.request('/api/digest/2026-10-28')).json()).toEqual({rows: [], badLines: 0});
  });
});
