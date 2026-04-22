export const truncate = (str, n) => (str.length > n ? str.slice(0, n) + "…" : str);

export const normalizeHandle = (raw) => raw.trim().replace(/^@/, "").toLowerCase();

export const escapeHTML = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const timeAgo = (ts) => {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) {
    return "just now";
  } else if (mins === 1) {
    return "1 minute ago";
  }
  return `${mins} minutes ago`;
};
