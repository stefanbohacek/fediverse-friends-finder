import ready from "./modules/ready.js";
import { clearCache } from "./modules/cache.js";
import runSearch from "./modules/runSearch.js";
import { normalizeHandle } from "./modules/utils.js";
import { parseCallback } from "./modules/oauth/callback.js";
import { exchangeCodeForToken, isLoggedIn, logout, LS } from "./modules/oauth/login.js";

ready(async () => {
  const form        = document.getElementById("find-form");
  const handleInput = document.getElementById("handle-input");
  const refreshLink = document.getElementById("refresh-link");
  const logoutLink  = document.getElementById("logout-link");

  const submitBtn   = form.querySelector("button[type=submit]");
  submitBtn.disabled = !handleInput.value.trim();
  handleInput.addEventListener("input", () => {
    submitBtn.disabled = !handleInput.value.trim();
  });

  const params      = new URLSearchParams(window.location.search);
  const savedHandle = params.get("handle");

  let callbackData = null;
  try {
    callbackData = parseCallback();
  } catch (err) {
    // OAuth error returned from Bluesky — fall through to normal UI
  }

  if (callbackData) {
    try {
      await exchangeCodeForToken();
    } catch {
      // Token exchange failed — fall through to normal UI
    }
    const handle = localStorage.getItem(LS.HANDLE);
    if (handle) {
      handleInput.value = handle;
      history.replaceState(null, "", `?handle=${encodeURIComponent(handle)}`);
      runSearch(handle);
    }
  } else if (savedHandle) {
    handleInput.value = savedHandle;
    runSearch(savedHandle);
  }

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const handle = normalizeHandle(handleInput.value);
    if (handle) {
      history.replaceState(null, "", `?handle=${encodeURIComponent(handle)}`);
      runSearch(handle);
    }
  });

  if (isLoggedIn()) {
    logoutLink.classList.remove("d-none");
  }

  refreshLink.addEventListener("click", (ev) => {
    ev.preventDefault();
    const handle = normalizeHandle(handleInput.value);
    if (handle) {
      clearCache(handle);
      runSearch(handle, { force: true });
    }
  });

  logoutLink.addEventListener("click", async (ev) => {
    ev.preventDefault();
    await logout();
    logoutLink.classList.add("d-none");
  });
});
