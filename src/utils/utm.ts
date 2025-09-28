// Utilities to parse and persist UTM parameters for the current session
const UTM_STORAGE_KEY = 'utm_params_v1';

export type UtmMap = Partial<Record<'utm_source'|'utm_medium'|'utm_campaign'|'utm_term'|'utm_content', string>>;

export function readUtmFromLocation(search?: string): UtmMap {
  try {
    const qs = typeof search === 'string' ? search : (typeof window !== 'undefined' ? window.location.search : '');
    const params = new URLSearchParams(qs);
    const keys: Array<keyof UtmMap> = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'];
    const out: UtmMap = {};
    keys.forEach((k) => {
      const v = params.get(k);
      if (v) out[k] = v;
    });
    return out;
  } catch (e) {
    return {};
  }
}

export function persistUtm(utm: UtmMap) {
  try {
    if (!utm || Object.keys(utm).length === 0) return;
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  } catch (e) {
    // noop
  }
}

export function getPersistedUtm(): UtmMap | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw || '{}');
  } catch (e) {
    return null;
  }
}

export function getUtm(): UtmMap {
  // prefer persisted values, fallback to location
  const persisted = getPersistedUtm();
  if (persisted && Object.keys(persisted).length > 0) return persisted;
  const read = readUtmFromLocation();
  if (read && Object.keys(read).length > 0) persistUtm(read);
  return read;
}

export function clearUtm() {
  try { if (typeof window !== 'undefined') sessionStorage.removeItem(UTM_STORAGE_KEY); } catch (e) {}
}

export default { readUtmFromLocation, persistUtm, getPersistedUtm, getUtm, clearUtm };
