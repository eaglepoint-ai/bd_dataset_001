import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
  type FormEvent,
  type JSX,
} from "react";
import "../App.css";
import {
  createSong,
  createCancelToken,
  isRequestCancelled,
  getErrorMessage,
} from "../services/songService";
import type { SongFormData, SongFormField } from "../types/song";

const INITIAL_FORM_STATE: SongFormData = {
  title: "",
  artist: "",
  album: "",
  genre: "",
};

const FORM_FIELDS: Array<{
  name: SongFormField;
  label: string;
  placeholder: string;
}> = [
  { name: "title", label: "Title", placeholder: "Enter song title" },
  { name: "artist", label: "Artist", placeholder: "Enter artist name" },
  { name: "album", label: "Album", placeholder: "Enter album name" },
  { name: "genre", label: "Genre", placeholder: "Enter genre" },
];

const validateForm = (formData: SongFormData): string[] => {
  const errors: string[] = [];

  if (!formData.title.trim()) {
    errors.push("Title is required");
  }
  if (!formData.artist.trim()) {
    errors.push("Artist is required");
  }
  if (!formData.album.trim()) {
    errors.push("Album is required");
  }
  if (!formData.genre.trim()) {
    errors.push("Genre is required");
  }

  return errors;
};

const trimFormData = (formData: SongFormData): SongFormData => ({
  title: formData.title.trim(),
  artist: formData.artist.trim(),
  album: formData.album.trim(),
  genre: formData.genre.trim(),
});

const CreateSongsForm = (): JSX.Element => {
  const [formData, setFormData] = useState<SongFormData>(INITIAL_FORM_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [touchedFields, setTouchedFields] = useState<Set<SongFormField>>(
    new Set(),
  );

  // Ref to track if component is mounted so we use this for cleanup
  const isMountedRef = useRef<boolean>(true);
  // Ref to store cancel token source
  const cancelTokenRef = useRef<ReturnType<typeof createCancelToken> | null>(
    null,
  );

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Cancel any pending request on unmount
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel("Component unmounted");
      }
    };
  }, []);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const { name, value } = event.target;
      const fieldName = name as SongFormField;

      setFormData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));

      if (isSuccess) {
        setIsSuccess(false);
      }
      if (errorMessage) {
        setErrorMessage("");
      }

      if (value.trim() && validationErrors.length > 0) {
        setValidationErrors((prev) =>
          prev.filter(
            (error) => !error.toLowerCase().includes(fieldName.toLowerCase()),
          ),
        );
      }
    },
    [isSuccess, errorMessage, validationErrors],
  );

  const handleInputBlur = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const fieldName = event.target.name as SongFormField;
      setTouchedFields((prev) => new Set(prev).add(fieldName));
    },
    [],
  );

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    // Prevent duplicate submissions
    if (isLoading) {
      return;
    }

    // Clear previous messages
    setErrorMessage("");
    setValidationErrors([]);

    // Mark all fields as touched
    setTouchedFields(new Set(FORM_FIELDS.map((f) => f.name)));

    // Validate form
    const errors = validateForm(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Trim form data before submission
    const trimmedData = trimFormData(formData);

    // Cancel any existing request
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel("New request initiated");
    }

    // Create new cancel token
    cancelTokenRef.current = createCancelToken();

    setIsLoading(true);

    try {
      await createSong(trimmedData, cancelTokenRef.current.token);

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setFormData(INITIAL_FORM_STATE);
        setIsSuccess(true);
        setTouchedFields(new Set());
      }
    } catch (error: unknown) {
      if (isRequestCancelled(error)) {
        return;
      }

      if (isMountedRef.current) {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        cancelTokenRef.current = null;
      }
    }
  };

  const hasFieldError = (fieldName: SongFormField): boolean => {
    return (
      touchedFields.has(fieldName) &&
      validationErrors.some((error) =>
        error.toLowerCase().includes(fieldName.toLowerCase()),
      )
    );
  };

  return (
    <div className="song-form-container">
      <h1 className="form-heading">Create Song</h1>

      {isSuccess && (
        <p className="success-message" role="status" aria-live="polite">
          Song recorded successfully!
        </p>
      )}

      {errorMessage && (
        <p className="error-message" role="alert" aria-live="assertive">
          {errorMessage}
        </p>
      )}

      {validationErrors.length > 0 && (
        <div className="validation-errors" role="alert" aria-live="assertive">
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form
        className="song-form"
        onSubmit={handleSubmit}
        noValidate
        aria-describedby={
          errorMessage
            ? "form-error"
            : validationErrors.length > 0
              ? "validation-errors"
              : undefined
        }
      >
        {FORM_FIELDS.map(({ name, label, placeholder }) => (
          <div className="form-group" key={name}>
            <label htmlFor={name} className="form-label">
              {label}:
              <span className="required-indicator" aria-hidden="true">
                {" "}
                *
              </span>
            </label>
            <input
              type="text"
              id={name}
              name={name}
              value={formData[name]}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className="form-input"
              placeholder={placeholder}
              required
              aria-required="true"
              aria-invalid={hasFieldError(name)}
              aria-describedby={
                hasFieldError(name) ? `${name}-error` : undefined
              }
              disabled={isLoading}
            />
          </div>
        ))}

        <button
          type="submit"
          className="form-button"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner" aria-hidden="true"></span>
              Creating...
            </>
          ) : (
            "Create"
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateSongsForm;
