import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import TechStackBar from "../components/TechStackBar.jsx";
import DiffCard from "../components/DiffCard.jsx";
import RepoCard from "../components/RepoCard.jsx";
import "../styles/portfolio.css";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const LOADING_MESSAGES = [
  "cloning repo metadata...",
  "reading source files...",
  "reviewing your code like a hiring manager...",
  "picking the best function...",
  "almost there...",
];

export default function Portfolio() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIndex]);
    }, 2200);

    async function run() {
      setData(null);
      setError("");
      const linkedin = sessionStorage.getItem(`linkedin:${username}`) || "";
      try {
        const res = await fetch(`${API_URL}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, linkedin }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Something went wrong");
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }
    run();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [username]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (error) {
    return (
      <div className="pf-state">
        <div className="error-box">error: {error}</div>
        <Link className="back" to="/">
          ← try another username
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pf-state">
        <div className="spinner-line">$ generating {username}'s proof of work…</div>
        <div className="muted-line">{loadingMsg}</div>
      </div>
    );
  }

  const { profile, techStack, topRepos, analysis, linkedin } = data;

  return (
    <div className="pf">
      <div className="pf-header">
        <img className="pf-avatar" src={profile.avatarUrl} alt={profile.name || username} />
        <div>
          <h1 className="pf-name">{profile.name || username}</h1>
          <div className="pf-username">
            @{username} {profile.location ? `· ${profile.location}` : ""}
          </div>
        </div>
        <div className="pf-links">
          <a href={profile.githubUrl} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          {linkedin && (
            <a
              href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`}
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn ↗
            </a>
          )}
        </div>
      </div>

      {analysis?.headline && <h2 className="pf-headline">"{analysis.headline}"</h2>}
      {analysis?.summary && <p className="pf-summary">{analysis.summary}</p>}

      {analysis?.strengths?.length > 0 && (
        <>
          <div className="pf-section-label">Why this profile stands out</div>
          <ul className="pf-strengths">
            {analysis.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </>
      )}

      <div className="pf-section-label">Tech stack (by code volume)</div>
      <TechStackBar techStack={techStack} />

      {analysis?.bestPick && (
        <>
          <div className="pf-section-label">Best code found</div>
          <DiffCard bestPick={analysis.bestPick} />
        </>
      )}

      <div className="pf-section-label">Top repositories</div>
      <div className="pf-repos">
        {topRepos.map((r) => (
          <RepoCard key={r.name} repo={r} />
        ))}
      </div>

      {analysis?.growthTip && (
        <div className="pf-growth">
          <strong>Next up</strong>
          {analysis.growthTip}
        </div>
      )}

      <div className="pf-share">
        <input readOnly value={window.location.href} />
        <button onClick={copyLink}>{copied ? "copied ✓" : "copy share link"}</button>
      </div>
    </div>
  );
}
