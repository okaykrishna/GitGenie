export default function DiffCard({ bestPick }) {
  if (!bestPick) return null;
  const lines = bestPick.codeSnippet?.split("\n") || [];

  return (
    <div className="diffcard">
      <div className="diffcard-head">
        <span className="diffcard-badge">reviewer's pick</span>
        <span className="diffcard-path">
          {bestPick.repo}/{bestPick.filePath}
        </span>
      </div>
      <div className="diffcard-code">
        {lines.map((line, i) => (
          <div className="diffcard-line" key={i}>
            <span className="diffcard-plus">+</span>
            <span className="diffcard-linenum">{i + 1}</span>
            <code>{line || " "}</code>
          </div>
        ))}
      </div>
      <div className="diffcard-comment">
        <div className="diffcard-comment-head">
          <span className="reviewer-avatar">AI</span>
          <span className="reviewer-name">code review</span>
          <span className="reviewer-fn">on {bestPick.functionName}</span>
        </div>
        <p>{bestPick.whyItMatters}</p>
      </div>
    </div>
  );
}
