import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readNight } from '../src/digest/reader.js';

describe('readNight', () => {
  it('aggregates the supplied night and counts the broken line', () => {
    const digest = readNight('runs', '2026-10-28');
    expect(digest?.rows).toHaveLength(5);
    expect(digest?.badLines).toBe(1);
    expect(digest?.rows.find(row => row.job === 'fixtures/refresh')).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', lastError: 'upstream 503' });
    expect(digest?.rows.find(row => row.job === 'digest/render')?.owner).toBeNull();
    expect(digest?.rows.find(row => row.job === 'notes/backup')?.lastStatus).toBe('fail');
  });
  it('handles missing and empty nights and rejects malformed records', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
    try {
      expect(readNight(dir, '2026-10-28')).toBeNull();
      writeFileSync(join(dir, '2026-10-28.jsonl'), '');
      expect(readNight(dir, '2026-10-28')).toEqual({ rows: [], badLines: 0 });
      writeFileSync(join(dir, '2026-10-28.jsonl'), '{}\n');
      expect(readNight(dir, '2026-10-28')).toEqual({ rows: [], badLines: 1 });
      expect(readNight(dir, '../secret')).toBeNull();
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
