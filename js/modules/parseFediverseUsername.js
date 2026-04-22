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
      });
    }
  };

  for (const m of bio.matchAll(MENTION_REGEX)) {
    if (!SKIP_DOMAINS.includes(m[2].toLowerCase())) {
      addAccount(m[1], m[2]);
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
