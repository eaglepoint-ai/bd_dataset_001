import axios, { AxiosError, isAxiosError } from 'axios';
import { API_BASE_URL } from '../config';

export interface Song {
  _id?: string; // Add this - often returned from API
  title: string;
  artist: string;
  album: string;
  genre: string;
}

export interface UpdateSongPayload {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
}

export interface UpdateSongResponse {
  _id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
}

export interface ApiErrorResponse {
  message?: string; // Make optional for flexibility
  error?: string;
}

export class SongServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'SongServiceError';
    // Add this for proper prototype chain in ES5
    Object.setPrototypeOf(this, SongServiceError.prototype);
  }
}

export const updateSongById = async (
  id: string,
  data: UpdateSongPayload,
  signal?: AbortSignal
): Promise<UpdateSongResponse> => {
  try {
    const response = await axios.put<UpdateSongResponse>(
      `${API_BASE_URL}/songs/${id}`,
      data,
      { signal }
    );
    return response.data;
  } catch (error: unknown) {
    // Handle abort error explicitly
    if (axios.isCancel(error)) {
      throw new SongServiceError('Request was cancelled', undefined);
    }

    if (isAxiosError<ApiErrorResponse>(error)) {
      const statusCode = error.response?.status;
      const message = error.response?.data?.message || error.response?.data?.error;

      if (statusCode === 404) {
        throw new SongServiceError('Song not found. Please check the ID and try again.', 404);
      } else if (statusCode === 400) {
        throw new SongServiceError(
          message || 'Invalid input. Please check your data and try again.',
          400
        );
      } else if (statusCode && statusCode >= 500) {
        throw new SongServiceError(
          'Server error. Please try again later.',
          statusCode
        );
      } else {
        throw new SongServiceError(
          message || 'An error occurred while updating the song.',
          statusCode
        );
      }
    }
    
    // Handle non-Axios errors
    throw new SongServiceError('Network error. Please check your connection and try again.');
  }
};
