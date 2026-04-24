export const setLoadingStatus = (message) => {
  document.getElementById("loading-status").textContent = message;
};

export const setError = (message) => {
  const alert = document.getElementById("error-alert");
  if (message) {
    alert.textContent = message.includes("Invalid handle")
      ? "Please make sure to use your full username, for example: username.bsky.app."
      : message;
    alert.classList.remove("d-none");
  } else {
    alert.classList.add("d-none");
  }
};
