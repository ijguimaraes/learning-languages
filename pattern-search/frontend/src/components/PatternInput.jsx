export default function PatternInput({ value, onChange, mode, onModeChange }) {
  return (
    <section style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
      <select value={mode} onChange={(e) => onModeChange(e.target.value)}>
        <option value="dep">dep</option>
        <option value="pos">pos</option>
      </select>
      <input
        id="pattern"
        type="text"
        placeholder={mode === 'dep' ? 'e.g. amod nsubj ROOT ~aux' : 'e.g. ADJ NOUN VERB ~ADP'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 300 }}
      />
    </section>
  )
}
