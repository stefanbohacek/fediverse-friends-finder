import { escapeHTML, truncate, timeAgo } from "./utils.js";

const avatarHtml = (src, alt, cls) => {
  if (src) {
    return /* html */ `
      <img src="${escapeHTML(src)}" alt="${escapeHTML(alt)}"
        class="${cls} rounded-circle flex-shrink-0 object-fit-cover" loading="lazy" />
    `;
  }
  return /* html */ `<div class="${cls} avatar-placeholder rounded-circle flex-shrink-0" aria-hidden="true"></div>`;
};

const buildUserCard = (user) => {
  const div = document.createElement("div");
  div.className = "card mb-3";

  const badges = user.fediverseHandles
    .map(
      (a) => /* html */ `
        <a href="${escapeHTML(a.url)}" target="_blank" rel="noopener noreferrer"
          class="fediverse-badge badge rounded-pill me-1 mb-1 text-wrap text-break">${escapeHTML(a.fullHandle)}</a>
      `,
    )
    .join("");

  const bio = user.description
    ? /* html */ `<p class="mb-0 small text-muted">${escapeHTML(truncate(user.description, 240))}</p>`
    : "";

  div.innerHTML = /* html */ `
    <div class="card-body d-flex gap-3 align-items-start">
      ${avatarHtml(user.avatar, user.displayName || user.handle, "avatar")}
      <div class="flex-grow-1 min-w-0">
        <div class="d-flex flex-wrap align-items-baseline gap-2 mb-1">
          <strong>${escapeHTML(user.displayName || user.handle)}</strong>
          <a href="https://bsky.app/profile/${escapeHTML(user.handle)}" target="_blank"
            rel="noopener noreferrer" class="small link-secondary text-break">@${escapeHTML(user.handle)}</a>
        </div>
        <div class="mb-1">${badges}</div>
        ${bio}
      </div>
    </div>
  `;

  return div;
};

export default (
  totalFollows,
  { fediverseAccounts, serverCounts },
  cachedAt,
) => {
  const cacheNote = cachedAt
    ? ` <small class="text-muted">(cached ${timeAgo(cachedAt)})</small>`
    : "";
  document.getElementById("summary-text").innerHTML = /* html */ `
    Scanned <strong>${totalFollows.toLocaleString()}</strong> followed accounts.
    Found <strong>${fediverseAccounts.length.toLocaleString()}</strong> with fediverse handles across
    <strong>${serverCounts.size.toLocaleString()}</strong> server${serverCounts.size === 1 ? "" : "s"}.
    ${cacheNote}
  `;

  const accountsList = document.getElementById("accounts-list");
  accountsList.innerHTML = "";
  if (fediverseAccounts.length === 0) {
    accountsList.innerHTML = /* html */ `<p class="text-muted">No fediverse accounts found among your follows.</p>`;
  } else {
    const frag = document.createDocumentFragment();
    for (const user of fediverseAccounts) frag.appendChild(buildUserCard(user));
    accountsList.appendChild(frag);
  }

  const serversList = document.getElementById("servers-list");
  serversList.innerHTML = "";
  const sorted = [...serverCounts.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    serversList.innerHTML = /* html */ `<p class="text-muted">No servers found.</p>`;
  } else {
    const frag = document.createDocumentFragment();
    for (const [server, count] of sorted) {
      const row = document.createElement("div");
      row.className = "d-flex justify-content-between align-items-center mb-2";
      row.innerHTML = /* html */ `
        <a href="https://${escapeHTML(server)}" target="_blank" rel="noopener noreferrer"
          class="text-break me-2">${escapeHTML(server)}</a>
        <span class="badge server-badge rounded-pill">${count}</span>
      `;
      frag.appendChild(row);
    }
    serversList.appendChild(frag);
  }

};
