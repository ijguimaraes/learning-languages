export default function SentenceList({ sentences }) {
  return (
    <section style={{ marginBottom: 16 }}>
      <h3>{sentences.length} sentences loaded</h3>
      <div style={{ maxHeight: 400, overflow: 'auto', border: '1px solid #ccc', padding: 8 }}>
        {sentences.map((s, i) => (
          <div key={i} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #eee' }}>
            <div><strong>{i + 1}.</strong> {s.text}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
              {s.tokens.map((t, j) => (
                <span key={j} style={{ textAlign: 'center', fontSize: 13 }}>
                  <div>{t.text}</div>
                  <div style={{ color: '#666', fontSize: 11 }}>{t.dep}</div>
                  <div style={{ color: '#999', fontSize: 11 }}>{t.pos}</div>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
