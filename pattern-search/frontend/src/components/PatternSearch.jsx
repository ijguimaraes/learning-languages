import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PatternInput from './PatternInput'
import SentenceList from './SentenceList'
import ResultsTable from './ResultsTable'
import SavedPatterns from './SavedPatterns'

export default function PatternSearch() {
  const { movieId } = useParams()
  const [movie, setMovie] = useState(null)
  const [sentences, setSentences] = useState(null)
  const [pattern, setPattern] = useState('')
  const [mode, setMode] = useState('dep')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(true)
  const [error, setError] = useState(null)
  const [movies, setMovies] = useState([])
  const [selectedMovieId, setSelectedMovieId] = useState(movieId)
  const [patterns, setPatterns] = useState([])

  useEffect(() => {
    fetch('/movies')
      .then((r) => r.json())
      .then((data) => {
        setMovies(data.movies)
        const current = data.movies.find((m) => m.id === movieId)
        setMovie(current || null)
      })
      .catch(() => {})
    loadPatterns()
    loadSubtitle()
  }, [movieId])

  function loadPatterns() {
    fetch('/patterns')
      .then((r) => r.json())
      .then((data) => setPatterns(data.patterns))
      .catch(() => {})
  }

  async function loadSubtitle() {
    setParsing(true)
    setError(null)
    setSentences(null)
    setResults(null)
    try {
      const res = await fetch(`/movies/${movieId}/parse`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to load subtitle')
      }
      const data = await res.json()
      setSentences(data.sentences)
    } catch (e) {
      setError(e.message)
    } finally {
      setParsing(false)
    }
  }

  function getSelectedMovieLanguage() {
    const m = movies.find((m) => m.id === selectedMovieId)
    return m?.language || 'en'
  }

  async function handleSearch() {
    if (!pattern.trim()) return
    setLoading(true)
    setError(null)
    try {
      const body = new FormData()
      body.append('pattern', pattern.trim())
      body.append('mode', mode)
      const res = await fetch(`/movies/${movieId}/search`, { method: 'POST', body })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Search failed')
      }
      setResults(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSavePattern() {
    if (!pattern.trim()) return
    try {
      const res = await fetch('/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: pattern.trim(),
          mode,
          language: getSelectedMovieLanguage(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to save pattern')
      }
      loadPatterns()
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleDeletePattern(id) {
    try {
      await fetch(`/patterns/${id}`, { method: 'DELETE' })
      loadPatterns()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <>
      <Link to="/">&larr; Back to movies</Link>
      <h1>{movie ? movie.title : 'Pattern Search'}</h1>
      {parsing && <p>Loading subtitle…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {sentences && (
        <>
          <SentenceList sentences={sentences} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <PatternInput value={pattern} onChange={setPattern} mode={mode} onModeChange={setMode} />
            <button
              onClick={handleSearch}
              disabled={!pattern.trim() || loading}
              style={{ padding: '8px 20px' }}
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
            <button
              onClick={handleSavePattern}
              disabled={!pattern.trim()}
              style={{ padding: '8px 20px' }}
            >
              Save Pattern
            </button>
          </div>
          {results && (
            <ResultsTable
              results={results}
              movies={movies}
              movieId={selectedMovieId}
              onMovieChange={setSelectedMovieId}
            />
          )}
          <SavedPatterns
            patterns={patterns}
            onDelete={handleDeletePattern}
            onRefresh={loadPatterns}
            movieId={movieId}
          />
        </>
      )}
    </>
  )
}
