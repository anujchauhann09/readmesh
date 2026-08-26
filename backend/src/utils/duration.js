const UNIT_MS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export const parseDurationMs = (value) => {
  if (typeof value === 'number') return value;
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(String(value).trim());
  if (!match) throw new Error(`Invalid duration string: "${value}"`);
  return Number(match[1]) * UNIT_MS[match[2]];
};
