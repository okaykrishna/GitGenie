const LANG_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Shell: "#89e051",
  Dart: "#00B4AB",
};

function colorFor(lang, i) {
  return LANG_COLORS[lang] || ["#6e9fff", "#e3b341", "#3fb950", "#f85149", "#a371f7"][i % 5];
}

export default function TechStackBar({ techStack }) {
  if (!techStack?.length) return null;
  const top = techStack.slice(0, 6);

  return (
    <div className="techstack">
      <div className="techstack-bar">
        {top.map((t, i) => (
          <div
            key={t.language}
            className="techstack-seg"
            style={{ width: `${t.percent}%`, background: colorFor(t.language, i) }}
            title={`${t.language} — ${t.percent}%`}
          />
        ))}
      </div>
      <div className="techstack-legend">
        {top.map((t, i) => (
          <div className="techstack-item" key={t.language}>
            <span className="dot-lang" style={{ background: colorFor(t.language, i) }} />
            {t.language} <span className="techstack-pct">{t.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
