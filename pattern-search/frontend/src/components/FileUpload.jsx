export default function FileUpload({ file, onFile, parsing }) {
  return (
    <section style={{ marginBottom: 12 }}>
      <label htmlFor="srt-upload">SRT file: </label>
      <input
        id="srt-upload"
        type="file"
        accept=".srt"
        onChange={(e) => onFile(e.target.files[0] ?? null)}
        disabled={parsing}
      />
      {file && <span> {file.name}</span>}
      {parsing && <span> Loading…</span>}
    </section>
  )
}
