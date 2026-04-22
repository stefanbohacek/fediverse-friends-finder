import ready from "./modules/ready.js";
import { clearCache } from "./modules/cache.js";
import runSearch from "./modules/runSearch.js";
import { normalizeHandle } from "./modules/utils.js";

ready(() => {
  const form = document.getElementById("find-form");
  const handleInput = document.getElementById("handle-input");
  const refreshLink = document.getElementById("refresh-link");

  const params = new URLSearchParams(window.location.search);
  const savedHandle = params.get("handle");

  if (savedHandle) {
    handleInput.value = savedHandle;
    runSearch(savedHandle);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const handle = normalizeHandle(handleInput.value);
    if (handle) {
      history.replaceState(null, "", `?handle=${encodeURIComponent(handle)}`);
      runSearch(handle);
    }
  });

  refreshLink.addEventListener("click", (e) => {
    e.preventDefault();
    const handle = normalizeHandle(handleInput.value);
    if (handle) {
      clearCache(handle);
      runSearch(handle, { force: true });
    }
  });
});
