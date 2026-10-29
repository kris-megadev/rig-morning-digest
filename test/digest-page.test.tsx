import { describe, expect, it } from 'vitest';
import { DigestPage } from '../src/views/digest.js';
import type { NightDigest } from '../src/digest/types.js';

describe('digest page', () => {
  it('renders sorted rows, missing values, and warnings', () => {
    const digest: NightDigest = { badLines: 1, rows: [
      { job: 'zeta', owner: null, runs: 4, retries: 3, lastStatus: 'fail', lastError: null, firstTime: '2026-10-28T01:00:00+02:00', lastTime: '2026-10-28T02:00:00+02:00' },
      { job: 'alpha', owner: 'Lee', runs: 1, retries: 0, lastStatus: 'ok', lastError: null, firstTime: 'first', lastTime: 'last' },
    ] };
    const html = String(<DigestPage night="2026-10-28" digest={digest} />);
    expect(html.indexOf('alpha')).toBeLessThan(html.indexOf('zeta'));
    expect(html).toContain('—');
    expect(html).toMatch(/class="warn">3/);
    expect(html).toMatch(/class="warn">fail/);
    expect(html).toContain('1 bad line');
    expect(html).toContain('2026-10-28T01:00:00+02:00');
  });
  it('renders an empty night', () => {
    expect(String(<DigestPage night="2026-10-28" digest={{rows: [], badLines: 0}} />)).toContain('nothing ran');
  });
});
