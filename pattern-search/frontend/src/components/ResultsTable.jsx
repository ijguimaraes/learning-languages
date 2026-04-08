import { useState } from 'react'

export default function ResultsTable({ results, movies, movieId, onMovieChange }) {
  const [added, setAdded] = useState({})
  const [adding, setAdding] = useState({})

  async function handleAdd(index, sentence) {
    if (!movieId) return
    setAdding((prev) => ({ ...prev, [index]: true }))
    try {
      const res = await fetch('/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: sentence, movie_id: movieId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to add card')
      }
      const data = await res.json()
      setAdded((prev) => ({ ...prev, [index]: data.position }))
    } catch (e) {
      alert(e.message)
    } finally {
      setAdding((prev) => ({ ...prev, [index]: false }))
    }
  }

  return (
    <section style={{ marginTop: 20 }}>
      <p>
        Found <strong>{results.match_count}</strong> match(es) across{' '}
        {results.total_sentences} sentences.
        Pattern ({results.mode}): <code>{results.pattern.join(' ')}</code>
      </p>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="movie-select">Movie: </label>
        <select id="movie-select" value={movieId} onChange={(e) => onMovieChange(e.target.value)}>
          {movies.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </div>
      {results.matches.length === 0 ? (
        <p>No matches found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Matched tokens</th>
              <th style={th}>Labels</th>
              <th style={th}>Sentence</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {results.matches.map((m, i) => (
              <tr key={i}>
                <td style={td}>{i + 1}</td>
                <td style={td}><strong>{m.tokens.join(' ')}</strong></td>
                <td style={td}><code>{m.labels.join(' ')}</code></td>
                <td style={td}>
                  <div>{m.sentence}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                    {m.sentence_tokens.map((t, j) => (
                      <span key={j} style={{ textAlign: 'center', fontSize: 13 }}>
                        <div>{t.text}</div>
                        <div style={{ color: '#666', fontSize: 11 }}>{t.dep}</div>
                        <div style={{ color: '#999', fontSize: 11 }}>{t.pos}</div>
                      </span>
                    ))}
                  </div>
                </td>
                <td style={td}>
                  {added[i] != null ? (
                    <span style={{ color: 'green' }}>Position {added[i]}</span>
                  ) : (
                    <button
                      onClick={() => handleAdd(i, m.sentence)}
                      disabled={!movieId || adding[i]}
                    >
                      {adding[i] ? '...' : 'Add as Card'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

const th = { border: '1px solid #ccc', padding: 8, textAlign: 'left', background: '#f5f5f5' }
const td = { border: '1px solid #ccc', padding: 8 }
