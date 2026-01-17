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
