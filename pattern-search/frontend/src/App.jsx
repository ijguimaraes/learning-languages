import { useState, useEffect } from 'react'
import FileUpload from './components/FileUpload'
import PatternInput from './components/PatternInput'
import SentenceList from './components/SentenceList'
import ResultsTable from './components/ResultsTable'
import SavedPatterns from './components/SavedPatterns'

export default function App() {
  const [file, setFile] = useState(null)
  const [sentences, setSentences] = useState(null)
  const [pattern, setPattern] = useState('')
  const [mode, setMode] = useState('dep')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState(null)
  const [movies, setMovies] = useState([])
  const [movieId, setMovieId] = useState('')
  const [patterns, setPatterns] = useState([])

  useEffect(() => {
    fetch('/movies')
      .then((r) => r.json())
      .then((data) => {
        setMovies(data.movies)
        if (data.movies.length > 0) setMovieId(data.movies[0].id)
      })
      .catch(() => {})
    loadPatterns()
  }, [])

  function loadPatterns() {
    fetch('/patterns')
      .then((r) => r.json())
      .then((data) => setPatterns(data.patterns))
      .catch(() => {})
  }

  function getSelectedMovieLanguage() {
    const movie = movies.find((m) => m.id === movieId)
    return movie?.language || 'en'
  }

  async function handleFile(selectedFile) {
    setFile(selectedFile)
    setResults(null)
    setSentences(null)
    setError(null)

    if (!selectedFile) return

    setParsing(true)
    try {
      const body = new FormData()
      body.append('file', selectedFile)
      const res = await fetch('/parse', { method: 'POST', body })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to parse file')
      }
      const data = await res.json()
      setSentences(data.sentences)
    } catch (e) {
      setError(e.message)
    } finally {
      setParsing(false)
    }
  }

  async function handleSearch() {
    if (!file || !pattern.trim()) return
    setLoading(true)
    setError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('pattern', pattern.trim())
      body.append('mode', mode)
      const res = await fetch('/search', { method: 'POST', body })
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
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1>Pattern Search</h1>
      <FileUpload file={file} onFile={handleFile} parsing={parsing} />
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
              disabled={!pattern.trim() || !movieId}
              style={{ padding: '8px 20px' }}
            >
              Save Pattern
            </button>
          </div>
          {results && (
            <ResultsTable results={results} movies={movies} movieId={movieId} onMovieChange={setMovieId} />
          )}
          <SavedPatterns
            patterns={patterns}
            onDelete={handleDeletePattern}
            onRefresh={loadPatterns}
            file={file}
            movieId={movieId}
          />
        </>
      )}
    </main>
  )
}
