import { escapeHTML, truncate, timeAgo } from "./utils.js";
import getFediverseDomains from "./fediverseDomains.js";
import { downloadCSV } from "./downloadCSV.js";
import { parseBio } from "./parseFediverseUsername.js";
import { getProfileDescription } from "./bluesky.js";

const detectServer = async (handle) => {
  try {
    const description = await getProfileDescription(handle);
    const accounts = parseBio(description);
    const nonBridged = accounts.find((a) => !a.bridged);
    return nonBridged?.server ?? null;
  } catch {
    return null;
  }
};

const avatarHtml = (src, alt, cls) => {
  if (src) {
    return /* html */ `
      <img src="${escapeHTML(src)}" alt="${escapeHTML(alt)}"
        class="${cls} rounded-circle flex-shrink-0 object-fit-cover" loading="lazy" />
    `;
  }
  return /* html */ `<div class="${cls} avatar-placeholder rounded-circle flex-shrink-0" aria-hidden="true"></div>`;
};

const buildUserCard = (user, knownDomains) => {
  const div = document.createElement("div");
  div.className = "card mb-3";

  const profileLinks = user.fediverseHandles
    .map((a) => {
      const known = knownDomains.has(a.server);
      const cls = known
        ? "fediverse-badge"
        : "fediverse-badge-muted unknown-domain";
      const indicator =
        known || a.bridged ? "" : ` <span aria-hidden="true">❓</span>`;
      const bridge = a.bridged
        ? ` <span aria-label="bridge" title="Followable via bridge">🌉</span>`
        : "";
      return /* html */ `
        <a href="${escapeHTML(a.url)}"
          data-fediverse-handle="${escapeHTML(a.fullHandle)}"
          target="_blank" rel="noopener noreferrer"
          class="${cls} badge rounded-pill me-1 mb-1 text-wrap text-break">${escapeHTML(a.fullHandle)}${bridge}${indicator}</a>
      `;
    })
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
        <div class="mb-1">${profileLinks}</div>
        ${bio}
      </div>
    </div>
  `;

  return div;
};

export default async (
  totalFollows,
  { fediverseAccounts, serverCounts },
  cachedAt,
  handle,
) => {
  const knownDomains = await getFediverseDomains();
  const cacheNote = cachedAt
    ? ` <small class="text-muted">(cached ${timeAgo(cachedAt)})</small>`
    : "";
  document.getElementById("summary-text").innerHTML = /* html */ `
    Scanned <strong>${totalFollows.toLocaleString()}</strong> followed accounts.
    Found <strong>${fediverseAccounts.length.toLocaleString()}</strong> with fediverse handles across
    <strong>${serverCounts.size.toLocaleString()}</strong> server${serverCounts.size === 1 ? "" : "s"}.
    ${cacheNote}
  `;

  const summaryRow = document.getElementById("summary-row");
  const noResultsCard = document.getElementById("no-results-card");
  const accountsServersRow = document.getElementById("accounts-servers-row");

  const accountsList = document.getElementById("accounts-list");
  accountsList.innerHTML = "";
  if (fediverseAccounts.length === 0) {
    summaryRow.classList.add("d-none");
    noResultsCard.classList.remove("d-none");
    noResultsCard.querySelector("p").innerHTML =
      /* html */ `None of the <strong>${totalFollows.toLocaleString()}</strong> accounts you follow in the Atmosphere have linked a fediverse profile yet.`;
    accountsServersRow.classList.add("d-none");
  } else {
    summaryRow.classList.remove("d-none");
    noResultsCard.classList.add("d-none");
    accountsServersRow.classList.remove("d-none");
    const frag = document.createDocumentFragment();
    for (const user of fediverseAccounts)
      frag.appendChild(buildUserCard(user, knownDomains));
    accountsList.appendChild(frag);

    const csvBtn = document.getElementById("download-csv-btn");
    csvBtn.classList.remove("d-none");
    const downloadAlert = document.getElementById("download-alert");
    csvBtn.onclick = () => {
      downloadCSV(fediverseAccounts);
      downloadAlert.classList.remove("d-none");
    };
  }

  const serverInput = document.getElementById("fediverse-server");
  const savedServer = localStorage.getItem("fediverseServer");

  if (savedServer) {
    serverInput.value = savedServer;
  } else {
    const detected = handle ? await detectServer(handle) : null;
    serverInput.value = detected ?? "mastodon.social";
  }

  const updateProfileLinks = () => {
    const server =
      serverInput.value.trim().replace(/\/+$/, "") || "mastodon.social";
    document.querySelectorAll("a[data-fediverse-handle]").forEach((a) => {
      const parts = a.dataset.fediverseHandle.split("@");
      const user = parts[1];
      const accountServer = parts[2];
      const path =
        server === accountServer ? `@${user}` : a.dataset.fediverseHandle;
      a.href = `https://${server}/${path}`;
    });
  };

  serverInput.addEventListener("input", () => {
    serverInput.value = serverInput.value.replace(/^https?:\/\//i, "");
    localStorage.setItem(
      "fediverseServer",
      serverInput.value.trim().replace(/\/+$/, ""),
    );
    updateProfileLinks();
  });

  updateProfileLinks();

  const serversList = document.getElementById("servers-list");
  serversList.innerHTML = "";
  const sorted = [...serverCounts.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    serversList.innerHTML = /* html */ `<p class="text-muted">No servers found.</p>`;
  } else {
    const frag = document.createDocumentFragment();
    for (const [server, count] of sorted) {
      const known = knownDomains.has(server);
      const row = document.createElement("div");
      row.className = `d-flex justify-content-between align-items-center mb-2${known ? "" : " unknown-domain"}`;
      row.innerHTML = /* html */ `
        <a href="https://${escapeHTML(server)}" target="_blank" rel="noopener noreferrer"
          class="text-break me-2">${escapeHTML(server)}${known ? "" : ` <span aria-hidden="true">❓</span>`}</a>
        <span class="badge server-badge rounded-pill">${count}</span>
      `;
      frag.appendChild(row);
    }
    serversList.appendChild(frag);
  }
};
