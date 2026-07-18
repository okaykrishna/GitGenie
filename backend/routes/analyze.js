import { Router } from "express";
import NodeCache from "node-cache";
import {
  getUserProfile,
  getUserRepos,
  rankRepos,
  buildTechStack,
  getSampleSourceFiles,
  getReadme,
} from "../services/github.js";
import { analyzeProfile } from "../services/gemini.js";

const router = Router();

// Cache generated portfolios for 6 hours so repeat visits / shared links
// don't re-burn GitHub + Gemini quota.
const cache = new NodeCache({ stdTTL: 6 * 60 * 60 });

router.post("/analyze", async (req, res) => {
  const { username, linkedin } = req.body || {};

  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "githubUsername is required" });
  }
  const cleanUsername = username.trim().replace(/^@/, "");

  const cacheKey = `portfolio:${cleanUsername.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  try {
    const profile = await getUserProfile(cleanUsername);
    const allRepos = await getUserRepos(cleanUsername);

    if (allRepos.length === 0) {
      return res.status(422).json({
        error: "No public, non-fork repositories found. Push some code first!",
      });
    }

    const topRepos = rankRepos(allRepos, 6);
    const techStack = await buildTechStack(cleanUsername, topRepos);

    // Only pull source samples for the top 3 to keep the Gemini prompt lean
    const reposForAnalysis = topRepos.slice(0, 3);
    const enrichedRepos = await Promise.all(
      reposForAnalysis.map(async (r) => {
        const [sampleFiles, readme] = await Promise.all([
          getSampleSourceFiles(cleanUsername, r),
          getReadme(cleanUsername, r),
        ]);
        return { ...r, sampleFiles, readme };
      })
    );

    const analysis = await analyzeProfile({
      username: cleanUsername,
      profile,
      techStack,
      repos: enrichedRepos,
    });

    const portfolio = {
      username: cleanUsername,
      linkedin: linkedin?.trim() || null,
      profile: {
        name: profile.name,
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
        location: profile.location,
        publicRepos: profile.public_repos,
        followers: profile.followers,
        githubUrl: profile.html_url,
      },
      techStack,
      topRepos: topRepos.map((r) => ({
        name: r.name,
        description: r.description,
        url: r.html_url,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
        pushedAt: r.pushed_at,
      })),
      analysis,
      generatedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, portfolio);
    res.json(portfolio);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Something went wrong" });
  }
});

export default router;
