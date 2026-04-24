import {
  resolveHandle,
  getFollowsCount,
  getAllFollows,
  requiresAuth,
} from "./bluesky.js";
import { loadCache, saveCache } from "./cache.js";
import processFollows from "./processFollows.js";
import renderResults from "./renderResults.js";
import { setLoadingStatus, setError } from "./UIHelpers.js";
import { login, isLoggedIn } from "./oauth/login.js";

const showSignInPrompt = (handle) => {
  const el = document.getElementById("signin-prompt");
  if (!el) return;
  el.classList.remove("d-none");
  el.querySelector("button").onclick = () => {
    el.classList.add("d-none");
    login(handle);
  };
};

export default async (handle, { force = false } = {}) => {
  const form = document.getElementById("find-form");
  const loadingSection = document.getElementById("loading-section");
  const resultsSection = document.getElementById("results-section");
  const userNav = document.getElementById("user-nav");

  setError(null);
  document.getElementById("signin-prompt")?.classList.add("d-none");
  resultsSection.classList.add("d-none");
  userNav.classList.add("d-none");
  loadingSection.classList.remove("d-none");
  form.querySelector("button[type=submit]").disabled = true;

  try {
    let follows;
    let cachedAt = null;

    const cached = !force && loadCache(handle);
    if (cached) {
      follows = cached.follows;
      cachedAt = cached.ts;
      setLoadingStatus("Loading from cache…");
    } else {
      setLoadingStatus("Resolving handle…");
      const did = await resolveHandle(handle);

      if (
        window.location.hostname !== "localhost" &&
        !isLoggedIn() &&
        (await requiresAuth(did))
      ) {
        loadingSection.classList.add("d-none");
        showSignInPrompt(handle);
        return;
      }

      const total = await getFollowsCount(did);

      setLoadingStatus("Fetching follows…");
      follows = await getAllFollows(did, (n) => {
        const outOf = total ? ` out of ${total.toLocaleString()}` : "";
        setLoadingStatus(
          `Fetching follows… (${n.toLocaleString()} loaded${outOf})`,
        );
      });
      saveCache(handle, follows);
    }

    setLoadingStatus("Parsing bios…");
    const results = processFollows(follows);

    loadingSection.classList.add("d-none");
    await renderResults(follows.length, results, cachedAt, handle);
    resultsSection.classList.remove("d-none");
    userNav.classList.remove("d-none");
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    loadingSection.classList.add("d-none");
    setError(err.message || "Could not complete the search. Please try again.");
  } finally {
    form.querySelector("button[type=submit]").disabled = false;
  }
};
