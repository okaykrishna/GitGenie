export default function RepoCard({ repo }) {
  return (
    <a className="repocard" href={repo.url} target="_blank" rel="noreferrer">
      <div className="repocard-top">
        <span className="repocard-name">{repo.name}</span>
        <span className="repocard-stars">★ {repo.stars}</span>
      </div>
      <p className="repocard-desc">{repo.description || "No description provided."}</p>
      <div className="repocard-lang">{repo.language || "—"}</div>
    </a>
  );
}
