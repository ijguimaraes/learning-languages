import { Routes, Route } from 'react-router-dom'
import MovieList from './components/MovieList'
import PatternSearch from './components/PatternSearch'

export default function App() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <Routes>
        <Route path="/" element={<MovieList />} />
        <Route path="/movies/:movieId/patterns" element={<PatternSearch />} />
      </Routes>
    </main>
  )
}
