import sleep from "./sleep.js";

const API_BASE = "https://public.api.bsky.app/xrpc";

export const resolveHandle = async (handle) => {
  const resp = await fetch(
    `${API_BASE}/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`,
  );
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(
      err.message ||
        `Could not find handle @${handle}. Please check your handle and try again.`,
    );
  }
  const { did } = await resp.json();
  return did;
};

export const getFollowsCount = async (actor) => {
  const resp = await fetch(
    `${API_BASE}/app.bsky.actor.getProfile?actor=${encodeURIComponent(actor)}`,
  );
  if (!resp.ok) {
    return null;
  }
  const data = await resp.json();
  return data.followsCount ?? null;
};

export const getAllFollows = async (actor, onProgress) => {
  const follows = [];
  let cursor;
  do {
    const url = new URL(`${API_BASE}/app.bsky.graph.getFollows`);
    url.searchParams.set("actor", actor);
    url.searchParams.set("limit", "100");

    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    const resp = await fetch(url);

    if (!resp.ok) {
      throw new Error(`Failed to load follows (HTTP ${resp.status})`);
    }
    const data = await resp.json();

    follows.push(...data.follows);
    cursor = data.cursor;
    onProgress?.(follows.length);

    if (cursor) {
      await sleep(300);
    }
  } while (cursor);
  return follows;
};
