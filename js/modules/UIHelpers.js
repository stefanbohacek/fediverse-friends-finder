export const setLoadingStatus = (message) => {
  document.getElementById("loading-status").textContent = message;
};

export const setError = (message) => {
  const alertEl = document.getElementById("error-alert");
  if (message) {
    alertEl.textContent = message.includes("Invalid handle")
      ? "Please make sure to use your full username, for example: username.bsky.app."
      : message;
    alertEl.classList.remove("d-none");
  } else {
    alertEl.classList.add("d-none");
  }
};
