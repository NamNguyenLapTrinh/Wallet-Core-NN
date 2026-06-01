/**
 * secureLogger.ts
 *
 * Production-safe logger for the wallet layer.
 *
 * RULES
 *   1. NEVER pass a mnemonic / private-key / seed / signed-tx hex to this
 *      logger. The redactor will catch obvious cases; do not rely on it
 *      as a security boundary.
 *   2. In production (`__DEV__ === false`) every method is a no-op except
 *      `error`, which forwards a redacted message to a host crash reporter
 *      (set via `configureSecureLogger`).
 *   3. In dev, output goes to `console.*` with redaction applied.
 *
 * The redactor is intentionally aggressive — false positives (over-masking)
 * are preferred over false negatives (leaking a secret).
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type CrashReporter = (level: LogLevel, message: string, meta?: unknown) => void;

let crashReporter: CrashReporter | null = null;

export const configureSecureLogger = (opts: { crashReporter?: CrashReporter }) => {
  crashReporter = opts.crashReporter ?? null;
};

// ── Redaction ──────────────────────────────────────────────────────────────

const HEX_BIG = /\b(0x)?[a-fA-F0-9]{40,}\b/g;            // 20-byte+ hex strings
const BIP39_LIKE = /\b(?:[a-z]+\s){11,23}[a-z]+\b/g;     // 12–24 lowercase words
const KEY_FIELD_RE = /(mnemonic|seed|privateKey|private_key|secret|password|pin)\s*[:=]\s*"[^"]*"/gi;

const redactString = (s: string): string =>
  s
    .replace(KEY_FIELD_RE, '$1: "[REDACTED]"')
    .replace(HEX_BIG, '[REDACTED:HEX]')
    .replace(BIP39_LIKE, '[REDACTED:WORDLIST]');

const redactArg = (arg: unknown, depth = 0): unknown => {
  if (depth > 3) return '[REDACTED:DEPTH]';
  if (typeof arg === 'string') return redactString(arg);
  if (typeof arg !== 'object' || arg === null) return arg;
  if (Array.isArray(arg)) return arg.map((a) => redactArg(a, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(arg as Record<string, unknown>)) {
    if (/mnemonic|seed|privatekey|secret|password|pin/i.test(k)) {
      out[k] = '[REDACTED]';
    } else {
      out[k] = redactArg(v, depth + 1);
    }
  }
  return out;
};

// ── Public API ──────────────────────────────────────────────────────────────

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

const emit = (level: LogLevel, message: string, meta?: unknown) => {
  const redactedMsg = redactString(message);
  const redactedMeta = meta !== undefined ? redactArg(meta) : undefined;

  if (isDev) {
    const fn =
      level === 'error' ? console.error :
      level === 'warn'  ? console.warn  :
      level === 'info'  ? console.info  :
                          console.log;
    if (redactedMeta !== undefined) fn(`[wallet:${level}]`, redactedMsg, redactedMeta);
    else fn(`[wallet:${level}]`, redactedMsg);
  }

  if (level === 'error' && crashReporter) {
    try {
      crashReporter('error', redactedMsg, redactedMeta);
    } catch {
      // Never let the logger throw.
    }
  }
};

export const secureLogger = {
  debug: (msg: string, meta?: unknown) => isDev && emit('debug', msg, meta),
  info:  (msg: string, meta?: unknown) => isDev && emit('info',  msg, meta),
  warn:  (msg: string, meta?: unknown) => emit('warn',  msg, meta),
  error: (msg: string, meta?: unknown) => emit('error', msg, meta),
};
