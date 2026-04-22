const CSV_HEADER = [
  "Account address",
  "Show boosts",
  "Notify on new posts",
  "Languages",
];

const buildCSV = (fediverseAccounts) => {
  const rows = [CSV_HEADER];
  for (const user of fediverseAccounts) {
    for (const a of user.fediverseHandles) {
      rows.push([`${a.user}@${a.server}`, "true", "false", ""]);
    }
  }
  return rows.map((r) => r.join(",")).join("\n");
};

export const downloadCSV = (fediverseAccounts) => {
  const csv = buildCSV(fediverseAccounts);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "following_accounts.csv";
  link.click();
  URL.revokeObjectURL(url);
};
