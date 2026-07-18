const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

function buildPrompt({ username, profile, techStack, repos }) {
  const stackSummary = techStack
    .slice(0, 8)
    .map((t) => `${t.language} (${t.percent}%)`)
    .join(", ");

  const repoBlocks = repos
    .map((r) => {
      const files = (r.sampleFiles || [])
        .map((f) => `--- FILE: ${f.path} ---\n${f.content}`)
        .join("\n\n");
      return [
        `REPO: ${r.name}`,
        `Description: ${r.description || "(none)"}`,
        `Stars: ${r.stargazers_count}, Forks: ${r.forks_count}, Primary language: ${r.language || "n/a"}`,
        r.readme ? `README excerpt:\n${r.readme}` : "",
        files ? `Source samples:\n${files}` : "(no readable source files found)",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n=====\n\n");

  return `You are a senior engineering hiring manager reviewing a college student's GitHub profile to help them build a "Proof of Work" portfolio page for recruiters.

STUDENT: ${username} (${profile.name || "no display name"})
BIO: ${profile.bio || "n/a"}
DETECTED TECH STACK (by code volume): ${stackSummary || "unknown"}

Below are their top repositories with real source file samples.

${repoBlocks}

TASK: Analyze the actual code shown above (not just descriptions) and return ONLY valid JSON, no markdown fences, no commentary, matching exactly this schema:

{
  "headline": "one punchy sentence (max 14 words) summarizing this developer's strength, written for a recruiter",
  "summary": "2-3 sentences, plain language, no buzzwords, describing what this person actually builds and how skilled the code looks",
  "strengths": ["3 to 5 short bullet phrases, each grounded in something visible in the actual code or repo structure, not generic praise"],
  "bestPick": {
    "repo": "repo name the snippet is from",
    "filePath": "path of the file",
    "functionName": "name of the specific function/logic block being highlighted",
    "codeSnippet": "the actual function/logic block, verbatim from the source, max 25 lines, properly indented",
    "whyItMatters": "3-4 sentences explaining, in a recruiter-friendly way, why this specific piece of logic is impressive or well-engineered (e.g. edge case handling, algorithmic choice, clean abstraction, error handling). Be specific and reference actual details in the snippet, not generic compliments.",
    "language": "programming language of the snippet"
  },
  "growthTip": "one constructive, encouraging sentence suggesting a next skill or practice to level up, based on gaps you noticed"
}

Rules:
- codeSnippet must be real code copied from the provided source samples, not invented.
- If no source files were readable, set bestPick to null and explain why in growthTip instead.
- Keep the tone honest and specific. Do not exaggerate skill level. A junior/student-level project should be described as such, but framed constructively.
- Output raw JSON only.`;
}

export async function analyzeProfile({ username, profile, techStack, repos }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY is not configured on the server");
    err.status = 500;
    throw err;
  }

  const prompt = buildPrompt({ username, profile, techStack, repos });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`Gemini API error ${res.status}: ${body.slice(0, 300)}`);
    err.status = 502;
    throw err;
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const err = new Error("Gemini returned an empty response");
    err.status = 502;
    throw err;
  }

  const cleaned = text.replace(/^```json\s*|```\s*$/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const err = new Error("Could not parse Gemini's response as JSON");
    err.status = 502;
    throw err;
  }
}
