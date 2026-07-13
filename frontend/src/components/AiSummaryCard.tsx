/** Plain-language callout, styled to stand out so a non-technical reader knows to read this first. */
export function AiSummaryCard({ summary, label = "AI summary" }: { summary: string; label?: string }) {
  return (
    <div className="ai-summary-card">
      <div className="ai-summary-label">{label}</div>
      <p className="ai-summary-text">{summary}</p>
    </div>
  );
}
