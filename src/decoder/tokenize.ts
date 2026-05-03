import type { Tokens } from "./types";

export type TokenizeResult =
  | { ok: true; tokens: Tokens; normalized: string; backbone: string; suffix: string }
  | { ok: false; error: string; normalized: string };

const NORMAL_LENGTH = 16;

export function normalize(input: string): string {
  // Drop common visual separators that aren't part of any code: spaces, SAP-style
  // dots, hyphens, and underscores. Slashes are kept because they're part of the
  // sub-system formats (DGL, BS-Kit, kits).
  return input.replace(/[\s._-]+/g, "").toUpperCase();
}

export function tokenize(input: string): TokenizeResult {
  const normalized = normalize(input);

  if (normalized.length === 0) {
    return { ok: false, error: "Empty input", normalized };
  }

  if (normalized.length < NORMAL_LENGTH) {
    const missing = NORMAL_LENGTH - normalized.length;
    return {
      ok: false,
      error:
        `Expected ${NORMAL_LENGTH} characters in the standard ENS backbone, got ${normalized.length} after stripping spaces and dots. ` +
        `${missing} character(s) appear to be missing — typical layout is: ` +
        `<3-char type><2-char connection><1 pressure><2 size><1 screw><1 body><1 medium><1 option><4 detail>. ` +
        `Sub-system formats (DGL, BS-Kit, kits) require their own separators.`,
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
