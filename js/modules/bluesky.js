import sleep from "./sleep.js";

const API_BASE = "https://public.api.bsky.app/xrpc";

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required to view this account's follows.");
    this.name = "AuthRequiredError";
  }
}

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

export const requiresAuth = async (actor) => {
  const resp = await fetch(
    `${API_BASE}/app.bsky.actor.getProfile?actor=${encodeURIComponent(actor)}`,
  );
  if (!resp.ok) return false;
  const data = await resp.json();
  return data.labels?.some((l) => l.val === "!no-unauthenticated") ?? false;
};

export const getAllFollows = async (actor, onProgress) => {
  const follows = [];
  let cursor;
  do {
    const url = new URL(`${API_BASE}/app.bsky.graph.getFollows`);
    url.searchParams.set("actor", actor);
    url.searchParams.set("limit", "100");
    if (cursor) url.searchParams.set("cursor", cursor);

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to load follows (HTTP ${resp.status})`);
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

const fetchDNSRecord = async (name, type) => {
  const url = new URL("https://one.one.one.one/dns-query");
  url.searchParams.set("name", name);
  url.searchParams.set("type", type);

  const response = await fetch(url, {
    headers: {
      accept: "application/dns-json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
};

const getDIDFromWellKnown = async (handle) => {
  const response = await fetch(`https://${handle}/.well-known/atproto-did`);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.text();
};

export const getDID = async (handle) => {
  const data = await fetchDNSRecord(`_atproto.${handle}`, "TXT");

  const answer = data.Answer?.find((record) => record.data.startsWith('"did='));
  if (answer) {
    return answer.data.replace(/^"|"$/g, "").replace("did=", "");
  }

  return getDIDFromWellKnown(handle);
};
