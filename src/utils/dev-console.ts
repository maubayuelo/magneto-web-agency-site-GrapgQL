// Lightweight dev console wrapper to make server-side console.error output more informative
// Only used in development to avoid changing production behavior.
export function devConsoleError(...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    try {
      const timestamp = new Date().toISOString();

      // If the first arg is null or undefined, print a helpful marker.
      if (args.length === 1 && (args[0] === null || args[0] === undefined)) {
        console.error(`[dev-server-error ${timestamp}] Received null/undefined in server error log`, args[0]);
        return;
      }

      // Safely serialize arguments so that Errors and complex objects are readable in dev tools.
      const safeSerialize = (value: any) => {
        // Primitives: return as-is
        if (value === null || value === undefined) return value;
        const t = typeof value;
        if (t === 'string' || t === 'number' || t === 'boolean') return value;

        // Errors: return useful fields
        if (value instanceof Error) {
          return { __error: true, name: value.name, message: value.message, stack: value.stack };
        }

        // Try JSON.stringify with a replacer that handles Errors and circular refs
        try {
          const seen = new WeakSet();
          const str = JSON.stringify(value, function (_key, val) {
            if (val instanceof Error) {
              return { __error: true, name: val.name, message: val.message, stack: val.stack };
            }
            if (typeof val === 'object' && val !== null) {
              if (seen.has(val)) return '[Circular]';
              seen.add(val);
            }
            return val;
          });
          // Parse back to object where possible so objects print nicely in console.error
          try {
            return JSON.parse(str);
          } catch (_e) {
            return str;
          }
        } catch (_err) {
          try {
            return String(value);
          } catch (_e) {
            return value;
          }
        }
      };

      const formatted = args.map(safeSerialize);
      console.error(`[dev-server-error ${timestamp}]`, ...formatted);
      try {
        // Also print a compact JSON fallback so environments that collapse object output
        // (like the Next dev overlay) still have a readable string to show.
        const compact = formatted.length === 1 ? formatted[0] : formatted;
        const asString = typeof compact === 'string' ? compact : JSON.stringify(compact, null, 0);
        console.error(`[dev-server-error ${timestamp}] JSON:`, asString);
      } catch (_e) {
        // ignore fallback errors
      }
    } catch (e) {
      // fallback to regular console.error
      console.error(...args);
    }
  } else {
    console.error(...args);
  }
}

// Non-fatal diagnostics that should not trigger the Next.js dev overlay.
export function devConsoleWarn(...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    try {
      const timestamp = new Date().toISOString();
      const safeSerialize = (value: any) => {
        if (value === null || value === undefined) return value;
        const t = typeof value;
        if (t === 'string' || t === 'number' || t === 'boolean') return value;
        if (value instanceof Error) {
          return { __error: true, name: value.name, message: value.message, stack: value.stack };
        }
        try {
          const seen = new WeakSet();
          const str = JSON.stringify(value, function (_key, val) {
            if (val instanceof Error) {
              return { __error: true, name: val.name, message: val.message, stack: val.stack };
            }
            if (typeof val === 'object' && val !== null) {
              if (seen.has(val)) return '[Circular]';
              seen.add(val);
            }
            return val;
          });
          try {
            return JSON.parse(str);
          } catch (_e) {
            return str;
          }
        } catch (_err) {
          try {
            return String(value);
          } catch (_e) {
            return value;
          }
        }
      };

      const formatted = args.map(safeSerialize);
      console.warn(`[dev-server-warn ${timestamp}]`, ...formatted);
    } catch (e) {
      console.warn(...args);
    }
  } else {
    console.warn(...args);
  }
}
