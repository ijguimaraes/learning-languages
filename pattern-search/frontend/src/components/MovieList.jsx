import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AddMovieForm from './AddMovieForm'

export default function MovieList() {
  const [movies, setMovies] = useState([])
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

  function loadMovies() {
    fetch('/movies')
      .then((r) => r.json())
      .then((data) => setMovies(data.movies))
      .catch(() => {})
  }

  useEffect(() => { loadMovies() }, [])

  return (
    <>
      <h1>Movies</h1>
      <button
        onClick={() => setShowForm(!showForm)}
        style={{ marginBottom: 16, padding: '8px 20px' }}
      >
        {showForm ? 'Cancel' : 'Add Movie'}
      </button>
      {showForm && (
        <AddMovieForm
          onCreated={() => {
            setShowForm(false)
            loadMovies()
          }}
        />
      )}
      {movies.length === 0 ? (
        <p>No movies found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Title</th>
              <th style={th}>Language</th>
              <th style={th}>Genre</th>
              <th style={th}>Rating</th>
              <th style={th}>Release</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((m) => (
              <tr key={m.id}>
                <td style={td}>{m.title}</td>
                <td style={td}>{m.language}</td>
                <td style={td}>{m.genre || '-'}</td>
                <td style={td}>{m.rating ?? '-'}</td>
                <td style={td}>{m.release_date || '-'}</td>
                <td style={td}>
                  <button onClick={() => navigate(`/movies/${m.id}/patterns`)}>
                    Patterns
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

const th = { border: '1px solid #ccc', padding: 8, textAlign: 'left', background: '#f5f5f5' }
const td = { border: '1px solid #ccc', padding: 8 }
