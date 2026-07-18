import { Outlet, Link } from "react-router-dom";

export default function App() {
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">$</span> proof-of-work
        </Link>
        <a
          className="topbar-link"
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
        >
          made from your commits, not your claims
        </a>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        <span>Proof of Work &mdash; generated from real code, reviewed like a hiring manager would.</span>
      </footer>
    </div>
  );
}
