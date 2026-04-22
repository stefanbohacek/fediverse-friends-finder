const domainsPromise = fetch("data/fediverse-domains.txt")
  .then((r) => (r.ok ? r.text() : ""))
  .then((text) => new Set(text.split(",").map((d) => d.trim()).filter(Boolean)))
  .catch(() => new Set());

export default () => domainsPromise;
