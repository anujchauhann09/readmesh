export const createTtlCache = ({ ttlMs, max = 500 }) => {
  const store = new Map();

  const get = (key) => {
    const hit = store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= Date.now()) {
      store.delete(key);
      return undefined;
    }

    store.delete(key);
    store.set(key, hit);
    return hit.value;
  };

  const set = (key, value) => {
    if (store.has(key)) store.delete(key);
    else if (store.size >= max) store.delete(store.keys().next().value);
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  };

  return { get, set };
};
