const CACHE_TTL = 30 * 60 * 1000;
const cacheKey = (handle) => `fff:${handle}`;

export const loadCache = (handle) => {
  try {
    const raw = localStorage.getItem(cacheKey(handle));
    if (!raw) {
      return null;
    }
    const { ts, follows } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(cacheKey(handle));
      return null;
    }
    return { follows, ts };
  } catch {
    return null;
  }
};

export const saveCache = (handle, follows) => {
  try {
    localStorage.setItem(
      cacheKey(handle),
      JSON.stringify({ ts: Date.now(), follows }),
    );
  } catch {
    // noop
  }
};

export const clearCache = (handle) => {
  localStorage.removeItem(cacheKey(handle));
};

export const clearAllCache = () => {
  Object.keys(localStorage)
    .filter((k) => k.startsWith("fff:") && !k.startsWith("fff:oauth:"))
    .forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem("fediverseServer");
  localStorage.removeItem("fediverseServerPlatform");
};
