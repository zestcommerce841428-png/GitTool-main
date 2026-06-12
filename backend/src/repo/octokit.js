import { Octokit } from "@octokit/rest";

export const createOctokitInstance = (token) => {
  const octokit = new Octokit({ auth: token });

  // Surface expired/invalid GitHub tokens as a clear, actionable error instead
  // of letting a raw "Bad credentials" 401 bubble up generically (silent failure).
  octokit.hook.error("request", async (error) => {
    const isBadCreds =
      error?.status === 401 ||
      (error?.status === 403 && /bad credentials/i.test(error?.message || ""));
    if (isBadCreds) {
      const e = new Error(
        "Your GitHub token is invalid or has expired. Please reconnect GitHub in your profile to continue."
      );
      e.status = 401;
      e.code = "GITHUB_AUTH";
      throw e;
    }
    throw error;
  });

  return octokit;
};
