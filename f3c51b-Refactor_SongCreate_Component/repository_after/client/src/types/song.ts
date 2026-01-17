// Song Types and Interfaces

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  createdAt: string;
}

export interface CreateSongRequest {
  title: string;
  artist: string;
  album: string;
  genre: string;
}

export interface CreateSongResponse {
  message: string;
  song: Song;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: string[];
}

export interface SongFormData {
  title: string;
  artist: string;
  album: string;
  genre: string;
}

export type SongFormField = keyof SongFormData;
