'use client';

import { useEffect, useState } from 'react';
import { fetchSongs } from '@/lib/songService';
import type { Song } from '@/types/song';

export default function SongList() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSongs = async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSongs(signal);
      setSongs(data);
    } catch (err: any) {
      if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
        setError(err.message || 'Failed to load songs');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadSongs(controller.signal);
    return () => controller.abort();
  }, []);

  const handleRetry = () => {
    const controller = new AbortController();
    loadSongs(controller.signal);
  };

  if (loading) {
    return (
      <div className="song-list-container">
        <h1 className="song-list-heading">Song List</h1>
        <p role="status" aria-live="polite">Loading songs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="song-list-container">
        <h1 className="song-list-heading">Song List</h1>
        <p role="alert">{error}</p>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="song-list-container">
        <h1 className="song-list-heading">Song List</h1>
        <p>No songs available</p>
        <button onClick={handleRetry}>Refresh</button>
      </div>
    );
  }

  return (
    <div className="song-list-container">
      <h1 className="song-list-heading">Song List</h1>
      <button onClick={handleRetry}>Refresh</button>
      <ul>
        {songs.slice(0, 100).map((song) => (
          <li className="song-item" key={song.id}>
            <h3 className="song-title">{song.title}</h3>
            <p className="song-info">Artist: {song.artist}</p>
            <p className="song-info">Album: {song.album}</p>
            <p className="song-info">Genre: {song.genre}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
