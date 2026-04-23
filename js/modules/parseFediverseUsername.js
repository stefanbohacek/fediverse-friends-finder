const BRIDGE_DOMAINS = new Set(["bsky.brid.gy", "ap.brid.gy"]);

const SKIP_DOMAINS = [
  "beacons.ai",
  "bluesky.com",
  "bluesky.social",
  "bsky.app",
  "bsky.directory",
  "bsky.social",
  "codeberg.org",
  "discord.com",
  "discord.gg",
  "en.pronouns.page",
  "facebook.com",
  "fanme.link",
  "foundation.app",
  "fursona.directory",
  "gamejolt.com",
  "github.com",
  "gitlab.com",
  "instagram.com",
  "ko-fi.com",
  "linkedin.com",
  "linktr.ee",
  "manifold.xyz",
  "medium.com",
  "mixi.social",
  "patreon.com",
  "pfq.link",
  "pixiv.net",
  "printables.com",
  "pronouns.cc",
  "pronouns.page",
  "reddit.com",
  "skeb.jp",
  "substack.com",
  "t.co",
  "tangled.org",
  "tangled.sh",
  "threads.com",
  "threads.net",
  "tiktok.com",
  "truthsocial.com",
  "twitch.tv",
  "twitter.com",
  "vimeo.com",
  "wheretofind.me",
  "wonderl.ink",
  "x.com",
  "youtu.be",
  "youtube.com",
];

const skipDomain = (domain) =>
  SKIP_DOMAINS.includes(domain.replace(/^www\./, ""));

const MENTION_REGEX = /@([\w.-]+)@([\w-]+\.[\w.-]+)/g;
const URL_PATTERN = /(?:https?:\/\/)?[\w-]+\.[\w.-]+\/(?:web\/)?@\S+/g;
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
    if (!skipDomain(domain)) {
      addAccount(m[1], domain);
    }
  }

  for (const match of bio.matchAll(URL_PATTERN)) {
    const raw = match[0].startsWith("http") ? match[0] : `https://${match[0]}`;
    const url = URL.parse(raw);
    if (!url) continue;
    const m = url.pathname.match(
      /^\/(?:web\/)?@([\w][\w.-]*)(?:@([\w-]+\.[\w.-]+))?/,
    );
    if (!m) continue;
    const server = (m[2] || url.hostname).toLowerCase();
    if (!skipDomain(server)) {
      addAccount(m[1], server);
    }
  }

  return [...accounts.values()];
};
