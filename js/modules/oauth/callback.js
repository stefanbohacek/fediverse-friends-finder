import { LS } from "./login.js";

export function parseCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const iss = params.get("iss");
  const error = params.get("error");

  if (error) {
    const description = params.get("error_description") || error;
    window.history.replaceState({}, document.title, window.location.pathname);
    throw new Error(`Bluesky authorization error: ${description}`);
  }

  if (!code || !state) {
    return null;
  }

  const callbackData = { iss, state, code };
  localStorage.setItem(LS.CALLBACK_DATA, JSON.stringify(callbackData));

  window.history.replaceState({}, document.title, window.location.pathname);

  return callbackData;
}
