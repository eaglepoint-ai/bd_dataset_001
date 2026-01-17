import axios, { AxiosError, type CancelTokenSource } from "axios";
import { API_BASE_URL } from "../config";
import type {
  CreateSongRequest,
  CreateSongResponse,
  ApiErrorResponse,
} from "../types/song";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const createSong = async (
  songData: CreateSongRequest,
  cancelToken?: CancelTokenSource["token"],
): Promise<CreateSongResponse> => {
  const response = await apiClient.post<CreateSongResponse>(
    "/songs",
    songData,
    {
      cancelToken,
    },
  );
  return response.data;
};

export const createCancelToken = (): CancelTokenSource => {
  return axios.CancelToken.source();
};

export const isRequestCancelled = (error: unknown): boolean => {
  return axios.isCancel(error);
};

export const getErrorMessage = (error: unknown): string => {
  if (axios.isCancel(error)) {
    return "Request was cancelled";
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    if (axiosError.response) {
      const { status, data } = axiosError.response;

      // Handle specific HTTP status codes
      switch (status) {
        case 400:
          return data?.message || "Invalid song data. Please check your input.";
        case 404:
          return "The song endpoint was not found.";
        case 409:
          return data?.message || "A song with this title already exists.";
        case 422:
          return data?.details?.join(", ") || "Validation failed.";
        case 500:
          return "Server error. Please try again later.";
        default:
          return data?.message || `An error occurred (${status})`;
      }
    }

    if (axiosError.request) {
      return "Unable to reach the server. Please check your connection.";
    }
  }

  return "An unexpected error occurred. Please try again.";
};
