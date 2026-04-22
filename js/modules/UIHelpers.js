export const setLoadingStatus = (message) => {
  document.getElementById("loading-status").textContent = message;
};

export const setError = (message) => {
  const alert = document.getElementById("error-alert");
  if (message) {
    alert.textContent = message;
    alert.classList.remove("d-none");
  } else {
    alert.classList.add("d-none");
  }
};
