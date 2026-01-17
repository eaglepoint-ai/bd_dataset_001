import axios from 'axios';
import type { Song, ApiSong } from '@/types/song';

export const fetchSongs = async (signal: AbortSignal): Promise<Song[]> => {
  const response = await axios.get<ApiSong[]>('/api/songs', { signal });
  return response.data.map(song => ({
    id: song._id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    genre: song.genre
  }));
};
