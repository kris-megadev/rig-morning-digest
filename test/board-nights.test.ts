import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';

describe('night links', () => {
  it('links each sample night with job status counts', async () => {
    const config = { adapter: 'shim', installed: 'now', beatEverySeconds: 60, runsDir: 'runs' };
    const html = await (await createApp(config).request('/')).text();
    expect(html).toContain('href="/digest/2026-10-28"');
    expect(html).toContain('href="/digest/2026-10-27"');
    expect(html).toContain('ok 4 / retry 0 / fail 1');
  });
});
