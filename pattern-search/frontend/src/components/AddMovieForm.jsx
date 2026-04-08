import { useState } from 'react'

export default function AddMovieForm({ onCreated }) {
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('en')
  const [genre, setGenre] = useState('')
  const [releaseDate, setReleaseDate] = useState('')
  const [rating, setRating] = useState('')
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const body = new FormData()
      body.append('title', title.trim())
      body.append('original_language', language)
      if (genre) body.append('genre', genre)
      if (releaseDate) body.append('release_date', releaseDate)
      if (rating) body.append('rating', rating)
      if (file) body.append('file', file)
      const res = await fetch('/movies', { method: 'POST', body })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to create movie')
      }
      onCreated()
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20, padding: 12, border: '1px solid #ccc', borderRadius: 4 }}>
      <h3>New Movie</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label>
          Title *
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ marginLeft: 8, width: 300 }} />
        </label>
        <label>
          Language *
          <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} required style={{ marginLeft: 8, width: 60 }} placeholder="en" />
        </label>
        <label>
          Genre
          <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} style={{ marginLeft: 8, width: 200 }} placeholder="e.g. action, drama" />
        </label>
        <label>
          Release date
          <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} style={{ marginLeft: 8 }} />
        </label>
        <label>
          Rating
          <input type="number" step="0.1" min="0" max="10" value={rating} onChange={(e) => setRating(e.target.value)} style={{ marginLeft: 8, width: 80 }} />
        </label>
        <label>
          Subtitle (.srt)
          <input type="file" accept=".srt" onChange={(e) => setFile(e.target.files[0] ?? null)} style={{ marginLeft: 8 }} />
        </label>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={!title.trim() || submitting} style={{ marginTop: 12, padding: '8px 20px' }}>
        {submitting ? 'Creating…' : 'Create Movie'}
      </button>
    </form>
  )
}
