const GITHUB_API = "https://api.github.com";

function authHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "proof-of-work-app",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function ghFetch(path) {
  const res = await fetch(`${GITHUB_API}${path}`, { headers: authHeaders() });
  if (res.status === 404) {
    const err = new Error("GitHub resource not found");
    err.status = 404;
    throw err;
  }
  if (res.status === 403) {
    const err = new Error("GitHub rate limit hit. Add a GITHUB_TOKEN to raise the limit.");
    err.status = 429;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`GitHub API error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function getUserProfile(username) {
  return ghFetch(`/users/${encodeURIComponent(username)}`);
}

export async function getUserRepos(username) {
  // up to 100 most recently pushed, non-fork repos
  const repos = await ghFetch(
    `/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed&direction=desc`
  );
  return repos.filter((r) => !r.fork);
}

/** Rank repos: stars weighted highest, then recency, then has description/readme signal */
export function rankRepos(repos, limit = 6) {
  const scored = repos.map((r) => {
    const stars = r.stargazers_count || 0;
    const forks = r.forks_count || 0;
    const daysSincePush = (Date.now() - new Date(r.pushed_at).getTime()) / 86400000;
    const recencyScore = Math.max(0, 60 - daysSincePush) / 60; // decays over ~2 months
    const score = stars * 3 + forks * 1.5 + recencyScore * 5 + (r.description ? 1 : 0);
    return { repo: r, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.repo);
}

export async function getRepoLanguages(username, repoName) {
  try {
    return await ghFetch(`/repos/${username}/${repoName}/languages`);
  } catch {
    return {};
  }
}

/** Aggregate byte-weighted language totals across a set of repos */
export async function buildTechStack(username, repos) {
  const totals = {};
  await Promise.all(
    repos.map(async (repo) => {
      const langs = await getRepoLanguages(username, repo.name);
      for (const [lang, bytes] of Object.entries(langs)) {
        totals[lang] = (totals[lang] || 0) + bytes;
      }
    })
  );
  const totalBytes = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(totals)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percent: Math.round((bytes / totalBytes) * 1000) / 10,
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

const CODE_EXTENSIONS = [
  ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".rb",
  ".cpp", ".c", ".cs", ".php", ".rs", ".kt", ".swift",
];

/** Walk a repo's default branch tree and grab a handful of real source files (truncated) */
export async function getSampleSourceFiles(username, repo, maxFiles = 4, maxCharsPerFile = 3500) {
  try {
    const tree = await ghFetch(
      `/repos/${username}/${repo.name}/git/trees/${repo.default_branch}?recursive=1`
    );
    const candidates = (tree.tree || [])
      .filter((item) => item.type === "blob")
      .filter((item) => CODE_EXTENSIONS.some((ext) => item.path.endsWith(ext)))
      .filter((item) => !/(^|\/)(test|tests|__tests__|node_modules|dist|build|vendor)\//i.test(item.path))
      .filter((item) => item.size && item.size < 40000) // skip huge generated files
      .sort((a, b) => (b.size || 0) - (a.size || 0)) // prefer meatier files
      .slice(0, maxFiles);

    const files = await Promise.all(
      candidates.map(async (item) => {
        try {
          const raw = await fetch(
            `https://raw.githubusercontent.com/${username}/${repo.name}/${repo.default_branch}/${item.path}`
          );
          if (!raw.ok) return null;
          const text = await raw.text();
          return { path: item.path, content: text.slice(0, maxCharsPerFile) };
        } catch {
          return null;
        }
      })
    );
    return files.filter(Boolean);
  } catch {
    return [];
  }
}

export async function getReadme(username, repo) {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${username}/${repo.name}/${repo.default_branch}/README.md`
    );
    if (!res.ok) return "";
    const text = await res.text();
    return text.slice(0, 2000);
  } catch {
    return "";
  }
}
