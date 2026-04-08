export default function SentenceList({ sentences, analyzedIndexes, onToggleAnalyzed, showAll }) {
  const filtered = showAll
    ? sentences
    : sentences.filter((_, i) => !analyzedIndexes.has(i))

  return (
    <section style={{ marginBottom: 16 }}>
      <h3>
        {filtered.length} / {sentences.length} sentences
        {!showAll && ' (non-analyzed)'}
      </h3>
      <div style={{ maxHeight: 400, overflow: 'auto', border: '1px solid #ccc', padding: 8 }}>
        {filtered.map((s) => {
          const i = sentences.indexOf(s)
          const analyzed = analyzedIndexes.has(i)
          return (
            <div key={i} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #eee', opacity: analyzed ? 0.5 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={analyzed}
                  onChange={() => onToggleAnalyzed(i)}
                  title={analyzed ? 'Unmark as analyzed' : 'Mark as analyzed'}
                />
                <strong>{i + 1}.</strong> {s.text}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap', marginLeft: 28 }}>
                {s.tokens.map((t, j) => (
                  <span key={j} style={{ textAlign: 'center', fontSize: 13 }}>
                    <div>{t.text}</div>
                    <div style={{ color: '#666', fontSize: 11 }}>{t.dep}</div>
                    <div style={{ color: '#999', fontSize: 11 }}>{t.pos}</div>
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
