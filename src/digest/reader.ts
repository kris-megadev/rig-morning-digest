import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, ReadNight, RunStatus } from './types.js';

interface LogLine { at: string; job: string; status: RunStatus; owner: string | null; error?: string }

function parseLine(line: string): LogLine | null {
  try {
    const value: unknown = JSON.parse(line);
    if (typeof value !== 'object' || value === null) return null;
    const record = value as Record<string, unknown>;
    if (typeof record.at !== 'string' || Number.isNaN(Date.parse(record.at)) ||
        typeof record.job !== 'string' || !record.job ||
        !['ok', 'retry', 'fail'].includes(String(record.status)) ||
        !(typeof record.owner === 'string' || record.owner === null) ||
        !(record.error === undefined || typeof record.error === 'string')) return null;
    return record as unknown as LogLine;
  } catch { return null; }
}

export const readNight: ReadNight = (runsDir, night) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) return null;
  let content: string;
  try { content = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8'); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  const rows = new Map<string, DigestRow>();
  let badLines = 0;
  const lines = content.split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop();
  for (const line of lines) {
    const item = parseLine(line);
    if (!item) { badLines++; continue; }
    const row = rows.get(item.job);
    if (!row) {
      rows.set(item.job, { job: item.job, owner: item.owner, runs: 1, retries: Number(item.status === 'retry'), lastStatus: item.status, lastError: item.error ?? null, firstTime: item.at, lastTime: item.at });
      continue;
    }
    row.runs++;
    row.retries += Number(item.status === 'retry');
    if (Date.parse(item.at) < Date.parse(row.firstTime)) row.firstTime = item.at;
    if (Date.parse(item.at) >= Date.parse(row.lastTime)) {
      row.lastTime = item.at;
      row.lastStatus = item.status;
      row.owner = item.owner;
    }
    if (item.error !== undefined) row.lastError = item.error;
  }
  return { rows: [...rows.values()].sort((a, b) => a.job.localeCompare(b.job)), badLines };
};
