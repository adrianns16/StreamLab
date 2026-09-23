/* Shared, dependency-free data rules. All dates are exported in UTC. */
(function (root) {
  'use strict';
  const MAX_RECORDS = 5000;
  const trackUri = /^spotify:track:[A-Za-z0-9]{22}$/;
  const text = value => typeof value === 'string' && value.trim().length > 0;
  function counts(songs, mode, total) {
    if (mode !== 'total') return songs.map(s => Number(s.plays));
    if (!songs.length) return [];
    const n = Number(total);
    return songs.map((_, i) => Math.floor(n / songs.length) + (i < n % songs.length ? 1 : 0));
  }
  function inspect(songs, options, now = Date.now()) {
    const issues = [];
    const allocated = counts(songs, options.mode, options.total);
    const total = allocated.reduce((sum, n) => sum + n, 0);
    const milliseconds = songs.reduce((sum, s, i) => sum + Number(s.duration) * 1000 * allocated[i], 0);
    const from = new Date(options.start).getTime(), to = new Date(options.end).getTime();
    if (!songs.length) issues.push('Agrega al menos una canción.');
    if (options.mode === 'total' && (!Number.isInteger(Number(options.total)) || Number(options.total) < songs.length)) issues.push('El total debe ser un número entero y alcanzar para una reproducción por canción.');
    songs.forEach((s, i) => {
      const name = `Canción ${i + 1} (${s.track || 'sin título'})`;
      if (!text(s.track) || !text(s.artist)) issues.push(`${name}: falta título o artista.`);
      if (!trackUri.test(s.uri || '')) issues.push(`${name}: falta un enlace válido de Spotify.`);
      if (!Number.isInteger(Number(s.duration)) || s.duration < 1 || s.duration > 36000) issues.push(`${name}: revisa la duración (1 a 36 000 segundos).`);
      if (!Number.isInteger(allocated[i]) || allocated[i] < 1 || allocated[i] > MAX_RECORDS) issues.push(`${name}: revisa las reproducciones.`);
    });
    if (!Number.isInteger(total) || total < 1 || total > MAX_RECORDS) issues.push(`El total debe estar entre 1 y ${MAX_RECORDS} registros.`);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to || to > now) issues.push('Elige un período válido: inicio anterior al final y sin fechas futuras.');
    else if (Number.isFinite(milliseconds) && milliseconds > to - from) issues.push('El período no alcanza para la duración total. Amplíalo o reduce las reproducciones.');
    return { issues, allocated, total, milliseconds, from, to };
  }
  function record(song, timestamp) {
    return {ts: new Date(timestamp).toISOString(), username: 'demo', platform: 'web player (simulación)', ms_played: Number(song.duration) * 1000,
      conn_country: '', ip_addr_decrypted: '', user_agent_decrypted: '', master_metadata_track_name: song.track,
      master_metadata_album_artist_name: song.artist, master_metadata_album_album_name: song.album || null,
      spotify_track_uri: song.uri, episode_name: null, episode_show_name: null, spotify_episode_uri: null,
      reason_start: 'demo', reason_end: 'demo', shuffle: false, skipped: false, offline: false, offline_timestamp: null, incognito_mode: false};
  }
  function generate(songs, options) {
    const report = inspect(songs, options);
    if (report.issues.length) throw Error(report.issues[0]);
    const gap = (report.to - report.from - report.milliseconds) / (report.total + 1);
    const records = [];
    let cursor = report.from;
    songs.forEach((song, i) => {
      for (let j = 0; j < report.allocated[i]; j++) {
        cursor += gap + Number(song.duration) * 1000;
        records.push(record(song, Math.min(Math.round(cursor), report.to)));
      }
    });
    return records;
  }
  function estimateBytes(songs, options) {
    const allocated = counts(songs, options.mode, options.total);
    return songs.reduce((sum, song, i) => sum + (new TextEncoder().encode(JSON.stringify(record(song, 0))).length + 1) * Math.max(0, allocated[i] || 0), 2);
  }
  function cleanFilename(name) {
    const base = String(name || '').normalize('NFKC').replace(/\.json$/i, '').replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').replace(/^[. ]+|[. ]+$/g, '').slice(0, 80);
    return (base || 'historial_simulado') + '.json';
  }
  function accumulator() {
    return {records: 0, valid: 0, ignored: 0, duplicates: 0, invalidDates: 0, missingUris: 0, zeroDuration: 0, minutes: 0,
      minDate: Infinity, maxDate: -Infinity, seen: new Set(), songs: new Map(), artists: new Set(), albums: new Set(), days: new Set()};
  }
  function consume(a, rows, dedupe = true) {
    for (const r of rows) {
      a.records++;
      if (!r || typeof r !== 'object' || !text(r.master_metadata_track_name) || !text(r.master_metadata_album_artist_name) || typeof r.ms_played !== 'number' || !Number.isFinite(r.ms_played) || r.ms_played < 0) { a.ignored++; continue; }
      const title = r.master_metadata_track_name, artist = r.master_metadata_album_artist_name;
      const uri = trackUri.test(r.spotify_track_uri || '') ? r.spotify_track_uri : null;
      const date = typeof r.ts === 'string' && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(r.ts) ? Date.parse(r.ts) : NaN;
      const key = uri || JSON.stringify([artist, title, r.master_metadata_album_album_name || '']);
      // Only timestamped, same-track, same-duration events are duplicate candidates.
      if (Number.isFinite(date)) {
        const event = JSON.stringify([key, date, r.ms_played]);
        if (a.seen.has(event)) { a.duplicates++; if (dedupe) continue; }
        a.seen.add(event);
      } else a.invalidDates++;
      if (!uri) a.missingUris++;
      if (r.ms_played === 0) a.zeroDuration++;
      a.valid++; a.minutes += r.ms_played / 60000;
      a.artists.add(artist);
      if (text(r.master_metadata_album_album_name)) a.albums.add(JSON.stringify([artist, r.master_metadata_album_album_name]));
      if (Number.isFinite(date)) {
        a.minDate = Math.min(a.minDate, date); a.maxDate = Math.max(a.maxDate, date);
        a.days.add(new Date(date).toISOString().slice(0, 10));
      }
      const song = a.songs.get(key) || {title, artist, n: 0, minutes: 0};
      song.n++; song.minutes += r.ms_played / 60000; a.songs.set(key, song);
    }
    return a;
  }
  function daySpan(a) {
    return Number.isFinite(a.minDate) ? Math.floor(a.maxDate / 86400000) - Math.floor(a.minDate / 86400000) + 1 : 0;
  }
  const api = {MAX_RECORDS, counts, inspect, generate, estimateBytes, cleanFilename, accumulator, consume, daySpan};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StreamLabCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
