import { parseBio } from "./parseFediverseUsername.js";

export default (follows) => {
  const fediverseAccounts = [];
  const serverCounts = new Map();

  for (const follow of follows) {
    const accounts = parseBio(follow.description);

    if (accounts.length > 0) {
      fediverseAccounts.push({ ...follow, fediverseHandles: accounts });
      for (const account of accounts) {
        serverCounts.set(account.server, (serverCounts.get(account.server) ?? 0) + 1);
      }
    }
  }

  return { fediverseAccounts, serverCounts };
};
