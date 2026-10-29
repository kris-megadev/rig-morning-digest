export type RunStatus = 'ok' | 'retry' | 'fail';

export interface DigestRow {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: RunStatus;
  lastError: string | null;
  firstTime: string;
  lastTime: string;
}

export interface NightDigest {
  rows: DigestRow[];
  badLines: number;
}

/** Returns null when the requested night does not exist. */
export type ReadNight = (runsDir: string, night: string) => NightDigest | null;
