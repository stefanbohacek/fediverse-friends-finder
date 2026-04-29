export default async (domain) => {
  let isMastodonServerResult = false;
  if (domain) {
    try {
      const res = await fetch(
        `https://fediverse-info.stefanbohacek.com/node-info?domain=${encodeURIComponent(domain)}`,
      );
      if (res.ok) {
        const data = await res.json();
        isMastodonServerResult =
          data?.software?.name?.toLowerCase() === "mastodon";
      }
    } catch {
      return false;
    }
  }
  return isMastodonServerResult;
};
