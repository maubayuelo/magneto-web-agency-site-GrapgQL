// Phase 5f §2 (ADR 0007): the visitor's analytics choice, client-only, first-party localStorage.
// One origin serves /, /fr and /es, so one record covers every locale. The server never reads it (a cookie read in a
// server component would make every route dynamic).

export type ConsentChoice = 'granted' | 'denied';

export interface ConsentRecord {
  v: number;
  analytics: ConsentChoice;
  /** ISO date of the explicit choice. Restoring, reopening or a storage event never renews it. */
  at: string;
}

export const CONSENT_KEY = 'magneto-consent';
/** Bump for a consent-version or material purpose change (new non-essential tool, material policy change). */
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_DAYS = 365;
export const CONSENT_MAX_AGE_MS = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/**
 * The single validator for initial reads, cross-tab events and expiry checks. Fails closed: missing, malformed,
 * non-object, wrong version, unknown choice, missing / unparseable / future date, or expired → null.
 */
export function parseConsent(raw: string | null | undefined, now: number = Date.now()): ConsentRecord | null {
  if (typeof raw !== 'string' || raw === '') return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  const { v, analytics, at } = data as Record<string, unknown>;
  if (v !== CONSENT_VERSION) return null;
  if (analytics !== 'granted' && analytics !== 'denied') return null;
  if (typeof at !== 'string' || !ISO_DATE.test(at)) return null;
  const time = Date.parse(at);
  if (Number.isNaN(time) || time > now) return null;
  if (now - time >= CONSENT_MAX_AGE_MS) return null;
  return { v, analytics, at };
}

/** Milliseconds until the record expires (≤ 0 = expired). */
export function msUntilExpiry(record: ConsentRecord, now: number = Date.now()): number {
  return Date.parse(record.at) + CONSENT_MAX_AGE_MS - now;
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage; // may throw (blocked storage); callers catch
}

/** Stored choice only. Storage access errors return null. */
export function readConsent(now: number = Date.now()): ConsentRecord | null {
  try {
    const storage = getStorage();
    if (!storage) return null;
    return parseConsent(storage.getItem(CONSENT_KEY), now);
  } catch {
    return null;
  }
}

// An explicit choice whose write failed holds for the current page only (same 365-day limit). Cleared by a successful
// write and by any relevant cross-tab storage event (a newer choice from elsewhere).
let memoryRecord: ConsentRecord | null = null;

/** The choice that governs this page: an unsaved explicit choice first, then storage. */
export function getEffectiveConsent(now: number = Date.now()): ConsentRecord | null {
  if (memoryRecord) {
    if (msUntilExpiry(memoryRecord, now) > 0) return memoryRecord;
    memoryRecord = null;
  }
  return readConsent(now);
}

/** Never throws. If storage fails, the choice holds in memory for this page; the banner reappears on the next load. */
export function writeConsent(choice: ConsentChoice, now: number = Date.now()): ConsentRecord {
  const record: ConsentRecord = { v: CONSENT_VERSION, analytics: choice, at: new Date(now).toISOString() };
  try {
    const storage = getStorage();
    if (!storage) throw new Error('no storage');
    storage.setItem(CONSENT_KEY, JSON.stringify(record));
    memoryRecord = null;
  } catch {
    memoryRecord = record;
  }
  return record;
}

export function clearMemoryConsent(): void {
  memoryRecord = null;
}

/** This origin's localStorage events for our key, or `localStorage.clear()` (key null). Everything else is ignored. */
export function isRelevantStorageEvent(event: StorageEvent): boolean {
  if (event.key !== CONSENT_KEY && event.key !== null) return false;
  try {
    return event.storageArea === getStorage();
  } catch {
    return false;
  }
}

/**
 * Expires `_ga` and `_ga_<id without "G-">` (path /) host-only and for the host and every parent domain
 * (`a.b.c` → `a.b.c`, `.b.c`, `.c`; the browser ignores invalid ones). Other cookies are untouched.
 */
export function clearGaCookies(id: string, hostname?: string): void {
  if (typeof document === 'undefined') return;
  const host = hostname ?? (typeof location !== 'undefined' ? location.hostname : '');
  const names = ['_ga', `_ga_${id.replace(/^G-/, '')}`];
  const parts = host.split('.').filter(Boolean);
  const domains: Array<string | null> = [null];
  for (let i = 0; i < parts.length; i += 1) {
    const domain = parts.slice(i).join('.');
    domains.push(i === 0 ? domain : `.${domain}`);
  }
  const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/';
  for (const name of names) {
    for (const domain of domains) {
      try {
        document.cookie = `${name}=; ${expired}${domain ? `; domain=${domain}` : ''}`;
      } catch {
        // ignore: a rejected cookie write changes nothing
      }
    }
  }
}
