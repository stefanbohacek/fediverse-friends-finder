const BRIDGE_DOMAINS = new Set(["bsky.brid.gy", "ap.brid.gy"]);

const SKIP_DOMAINS = [
  "bsky.app",
  "bsky.social",
  "bluesky.com",
  "bluesky.social",
  "twitter.com",
  "x.com",
  "t.co",
  "instagram.com",
  "facebook.com",
  "threads.net",
  "threads.com",
  "github.com",
  "gitlab.com",
  "codeberg.org",
  "linkedin.com",
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "vimeo.com",
  "twitch.tv",
  "reddit.com",
  "discord.com",
  "discord.gg",
  "ko-fi.com",
  "patreon.com",
  "substack.com",
  "linktr.ee",
  "beacons.ai",
  "tangled.org",
  "tangled.sh",
  "medium.com",
  "truthsocial.com",
  "foundation.app",
  "bsky.directory",
];

const MENTION_REGEX = /@([\w.-]+)@([\w-]+\.[\w.]+)/g;
const URL_REGEX =
  /(?:https?:\/\/)?(?:www\.)?([\w-]+\.[\w.]+)\/(?:web\/)?@([\w][\w.-]*)/g;
export const parseBio = (bio) => {
  if (!bio) {
    return { accounts: [] };
  }

  const accounts = new Map();

  const addAccount = (user, rawServer) => {
    const server = rawServer.toLowerCase().replace(/\.$/, "");
    const fullHandle = `@${user}@${server}`;
    if (!accounts.has(fullHandle)) {
      accounts.set(fullHandle, {
        user,
        server,
        fullHandle,
        url: `https://${server}/@${user}`,
        bridged: BRIDGE_DOMAINS.has(server),
      });
    }
  };

  for (const m of bio.matchAll(MENTION_REGEX)) {
    const domain = m[2].toLowerCase();
    if (!SKIP_DOMAINS.includes(domain)) {
      addAccount(m[1], domain);
    }
  }

  for (const m of bio.matchAll(URL_REGEX)) {
    const server = m[1].toLowerCase();
    if (!SKIP_DOMAINS.includes(server)) {
      addAccount(m[2], server);
    }
  }

  return [...accounts.values()];
};
