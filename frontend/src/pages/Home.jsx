import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  const [username, setUsername] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const clean = username.trim().replace(/^@/, "");
    if (!clean) {
      setError("error: githubUsername cannot be empty");
      return;
    }
    setLoading(true);
    try {
      // Stash linkedin in sessionStorage so the Portfolio page can pick it up
      // on first generation without a second round trip.
      sessionStorage.setItem(`linkedin:${clean}`, linkedin.trim());
      navigate(`/p/${clean}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hero">
      <div className="hero-eyebrow">// proof of work</div>
      <h1>
        Your GitHub already proves it. <em>Let it talk.</em>
      </h1>
      <p className="sub">
        Drop your GitHub username. We pull your real repos, have an AI reviewer read your actual
        code, and generate a shareable page recruiters will actually look at.
      </p>

      <div className="terminal">
        <div className="terminal-bar">
          <span className="dot r" />
          <span className="dot y" />
          <span className="dot g" />
          <span className="terminal-title">generate-portfolio.sh</span>
        </div>
        <form className="terminal-body" onSubmit={handleSubmit}>
          <div className="terminal-line">
            <span className="prompt">$</span> <span className="cmd">./generate --profile</span>
          </div>
          <div className="field">
            <label htmlFor="username">github:</label>
            <input
              id="username"
              placeholder="octocat"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="linkedin">linkedin:</label>
            <input
              id="linkedin"
              placeholder="linkedin.com/in/you (optional)"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
            />
          </div>
          <button className="run-btn" type="submit" disabled={loading}>
            {loading ? "generating..." : "Run ▸ generate my page"}
          </button>
          {error && <div className="error-line">{error}</div>}
        </form>
      </div>
      <div className="hero-footnote">
        No sign-up. We only read public repo data. Takes ~15 seconds.
      </div>

      <div className="how">
        <div className="how-card">
          <div className="how-step">01</div>
          <h3>We read your repos</h3>
          <p>GitHub API pulls your top repositories, languages and real source files.</p>
        </div>
        <div className="how-card">
          <div className="how-step">02</div>
          <h3>AI reviews your code</h3>
          <p>Like a hiring manager, it finds your strongest function and explains why it's good.</p>
        </div>
        <div className="how-card">
          <div className="how-step">03</div>
          <h3>You get a shareable link</h3>
          <p>A clean, live page recruiters can open in 10 seconds &mdash; no PDF required.</p>
        </div>
      </div>
    </div>
  );
}
