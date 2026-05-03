import type { Tokens } from "./types";

export type TokenizeResult =
  | { ok: true; tokens: Tokens; normalized: string; backbone: string; suffix: string }
  | { ok: false; error: string; normalized: string };

const NORMAL_LENGTH = 16;

export function normalize(input: string): string {
  // Drop spaces and SAP-style separator dots (e.g. "26300.00.C19A5A30000" → "2630000C19A5A30000")
  return input.replace(/[\s.]+/g, "").toUpperCase();
}

export function tokenize(input: string): TokenizeResult {
  const normalized = normalize(input);

  if (normalized.length === 0) {
    return { ok: false, error: "Empty input", normalized };
  }

  if (normalized.length < NORMAL_LENGTH) {
    return {
      ok: false,
      error: `Expected at least ${NORMAL_LENGTH} characters, got ${normalized.length}`,
      normalized,
    };
  }

  const backbone = normalized.slice(0, NORMAL_LENGTH);
  const suffix = normalized.slice(NORMAL_LENGTH);

  const tokens: Tokens = {
    pos1to3: backbone.slice(0, 3),
    pos4to5: backbone.slice(3, 5),
    pos6: backbone.slice(5, 6),
    pos7to8: backbone.slice(6, 8),
    pos9: backbone.slice(8, 9),
    pos10: backbone.slice(9, 10),
    pos11: backbone.slice(10, 11),
    pos12: backbone.slice(11, 12),
    pos13to16: backbone.slice(12, 16),
  };

  return { ok: true, tokens, normalized, backbone, suffix };
}
