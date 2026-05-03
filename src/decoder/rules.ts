// Reserved for Phase 2: position 13-16 contextual rules and SonderKürzel suffix parsing.
// The Phase 1 cast-iron rule is inlined in `decode()` because it modifies the body-material
// field directly. As context-dependent rules accumulate, refactor them into Rule objects here.

export type Rule = {
  id: string;
  description: string;
  apply: (input: unknown) => unknown;
};

export const rules: Rule[] = [];
