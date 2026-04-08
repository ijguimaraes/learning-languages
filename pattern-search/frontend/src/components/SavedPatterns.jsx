import { useState } from 'react'

export default function SavedPatterns({ patterns, onDelete, onRefresh, file, movieId }) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)

  async function handleRunAll() {
    if (!file || !movieId) return
    setRunning(true)
    setResult(null)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('movie_id', movieId)
      const res = await fetch('/patterns/run', { method: 'POST', body })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to run patterns')
      }
      const data = await res.json()
      setResult(data)
    } catch (e) {
      alert(e.message)
    } finally {
      setRunning(false)
    }
  }

  if (patterns.length === 0) return null

  return (
    <section style={{ marginTop: 20, padding: 12, border: '1px solid #ccc', borderRadius: 4 }}>
      <h3>Saved Patterns</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <thead>
          <tr>
            <th style={th}>Pattern</th>
            <th style={th}>Mode</th>
            <th style={th}>Language</th>
            <th style={th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {patterns.map((p) => (
            <tr key={p.id}>
              <td style={td}><code>{p.pattern}</code></td>
              <td style={td}>{p.mode}</td>
              <td style={td}>{p.language}</td>
              <td style={td}>
                <button onClick={() => onDelete(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={handleRunAll}
        disabled={!file || !movieId || running}
        style={{ padding: '8px 20px' }}
      >
        {running ? 'Running…' : 'Run All'}
      </button>
      {result && (
        <p style={{ marginTop: 8, color: 'green' }}>
          {result.cards_created} card(s) created.
        </p>
      )}
    </section>
  )
}

const th = { border: '1px solid #ccc', padding: 8, textAlign: 'left', background: '#f5f5f5' }
const td = { border: '1px solid #ccc', padding: 8 }
