import type { Tokens } from "./types";

export type TokenizeResult =
  | { ok: true; tokens: Tokens; normalized: string }
  | { ok: false; error: string; normalized: string };

const NORMAL_LENGTH = 16;

export function normalize(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}

export function tokenize(input: string): TokenizeResult {
  const normalized = normalize(input);

  if (normalized.length === 0) {
    return { ok: false, error: "Empty input", normalized };
  }

  // Strip a trailing SonderKürzel (e.g. "RM", "CF") if present — kept raw for now.
  // The standard 16-character backbone is what we decode in Phase 1.
  const sixteen = normalized.slice(0, NORMAL_LENGTH);

  if (sixteen.length !== NORMAL_LENGTH) {
    return {
      ok: false,
      error: `Expected at least ${NORMAL_LENGTH} characters, got ${normalized.length}`,
      normalized,
    };
  }

  const tokens: Tokens = {
    pos1to3: sixteen.slice(0, 3),
    pos4to5: sixteen.slice(3, 5),
    pos6: sixteen.slice(5, 6),
    pos7to8: sixteen.slice(6, 8),
    pos9: sixteen.slice(8, 9),
    pos10: sixteen.slice(9, 10),
    pos11: sixteen.slice(10, 11),
    pos12: sixteen.slice(11, 12),
    pos13to16: sixteen.slice(12, 16),
  };

  return { ok: true, tokens, normalized: sixteen };
}
