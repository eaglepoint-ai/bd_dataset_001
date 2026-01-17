import { useState, ChangeEvent, FormEvent, useEffect, useRef } from 'react';
import React from 'react';
import '../App.css';
import { updateSongById, UpdateSongPayload, SongServiceError } from '../services/songService';
import { isValidMongoId, trimValue, hasNonEmptyValue } from '../utils/validation';

interface FormState {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
}

const SongUpdate = (): JSX.Element => {
  const [formData, setFormData] = useState<FormState>({
    id: '',
    title: '',
    artist: '',
    album: '',
    genre: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFieldChange = (field: keyof FormState) => (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    setIsSuccess(false);
    setError(null);
  };

  const validateForm = (): { isValid: boolean; errorMessage?: string } => {
    const trimmedId = trimValue(formData.id);

    if (!hasNonEmptyValue(formData.id)) {
      return { isValid: false, errorMessage: 'Song ID is required.' };
    }

    if (!isValidMongoId(trimmedId)) {
      return {
        isValid: false,
        errorMessage: 'Invalid ID format. ID must be a 24-character hexadecimal string.',
      };
    }

    const hasUpdateFields =
      hasNonEmptyValue(formData.title) ||
      hasNonEmptyValue(formData.artist) ||
      hasNonEmptyValue(formData.album) ||
      hasNonEmptyValue(formData.genre);

    if (!hasUpdateFields) {
      return {
        isValid: false,
        errorMessage: 'At least one field (title, artist, album, or genre) must be provided.',
      };
    }

    return { isValid: true };
  };

  const buildUpdatePayload = (): UpdateSongPayload => {
    const payload: UpdateSongPayload = {};

    if (hasNonEmptyValue(formData.title)) {
      payload.title = trimValue(formData.title);
    }
    if (hasNonEmptyValue(formData.artist)) {
      payload.artist = trimValue(formData.artist);
    }
    if (hasNonEmptyValue(formData.album)) {
      payload.album = trimValue(formData.album);
    }
    if (hasNonEmptyValue(formData.genre)) {
      payload.genre = trimValue(formData.genre);
    }

    return payload;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.errorMessage || 'Validation failed.');
      return;
    }

    const trimmedId = trimValue(formData.id);
    const updatePayload = buildUpdatePayload();

    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    abortControllerRef.current = new AbortController();

    try {
      await updateSongById(trimmedId, updatePayload, abortControllerRef.current.signal);
      
      setFormData({
        id: '',
        title: '',
        artist: '',
        album: '',
        genre: '',
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      if (err instanceof SongServiceError) {
        setError(err.message);
      } else if (err instanceof Error && err.name === 'CanceledError') {
        return;
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const trimmedId = trimValue(formData.id);
  const isIdValid = hasNonEmptyValue(formData.id) && isValidMongoId(trimmedId);
  const hasUpdateFields =
    hasNonEmptyValue(formData.title) ||
    hasNonEmptyValue(formData.artist) ||
    hasNonEmptyValue(formData.album) ||
    hasNonEmptyValue(formData.genre);
  const isSubmitDisabled = isLoading || !isIdValid || !hasUpdateFields;

  return (
    <div className="song-form-container">
      <h1 className="form-heading">Update Song</h1>
      
      {isLoading && <p className="loading-message">Updating song...</p>}
      {!isLoading && isSuccess && <p className="success-message">Song updated successfully!</p>}
      {!isLoading && error && <p className="error-message">{error}</p>}

      <form className="song-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="id" className="form-label">
            Id: <span aria-label="required">*</span>
          </label>
          <input
            type="text"
            id="id"
            value={formData.id}
            onChange={handleFieldChange('id')}
            className="form-input"
            placeholder="Enter song ID"
            required
            aria-required="true"
            aria-invalid={formData.id.length > 0 && !isIdValid}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title:
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={handleFieldChange('title')}
            className="form-input"
            placeholder="Enter song title"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="artist" className="form-label">
            Artist:
          </label>
          <input
            type="text"
            id="artist"
            value={formData.artist}
            onChange={handleFieldChange('artist')}
            className="form-input"
            placeholder="Enter artist name"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="album" className="form-label">
            Album:
          </label>
          <input
            type="text"
            id="album"
            value={formData.album}
            onChange={handleFieldChange('album')}
            className="form-input"
            placeholder="Enter album name"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="genre" className="form-label">
            Genre:
          </label>
          <input
            type="text"
            id="genre"
            value={formData.genre}
            onChange={handleFieldChange('genre')}
            className="form-input"
            placeholder="Enter genre"
            disabled={isLoading}
          />
        </div>

        <button type="submit" className="form-button" disabled={isSubmitDisabled}>
          {isLoading ? 'Updating...' : 'Update'}
        </button>
      </form>
    </div>
  );
};

export default SongUpdate;
