import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SongUpdate from '../repository_after/components/SongUpdate';
import { SongServiceError } from '../repository_after/services/songService';
import React from 'react';

// Create the mock function BEFORE mocking the module
const mockUpdateSongById = jest.fn();

// Mock the entire module
jest.mock('../repository_after/services/songService', () => ({
  ...jest.requireActual('../repository_after/services/songService'),
  updateSongById: (...args: any[]) => mockUpdateSongById(...args),
  SongServiceError: class SongServiceError extends Error {
    statusCode?: number;
    constructor(message: string, statusCode?: number) {
      super(message);
      this.name = 'SongServiceError';
      this.statusCode = statusCode;
      Object.setPrototypeOf(this, SongServiceError.prototype);
    }
  }
}));

describe('SongUpdate - After Refactor (Expected Passes)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateSongById.mockReset();
  });

  // Submit with empty ID
  test('PASSES: Prevents submission with empty ID', async () => {
    const user = userEvent.setup();

    render(<SongUpdate />);

    const titleInput = screen.getByPlaceholderText(/enter song title/i);
    const submitButton = screen.getByRole('button', { name: /update/i });

    await user.type(titleInput, 'Test Song');

    expect(submitButton).toBeDisabled();
    expect(mockUpdateSongById).not.toHaveBeenCalled();
  });

  // Submit with invalid ID format
  test('PASSES: Validates MongoDB ObjectId format', async () => {
    const user = userEvent.setup();

    render(<SongUpdate />);

    const idInput = screen.getByPlaceholderText(/enter song id/i);
    const titleInput = screen.getByPlaceholderText(/enter song title/i);
    const submitButton = screen.getByRole('button', { name: /update/i });

    await user.type(idInput, 'abc123');
    await user.type(titleInput, 'Test Song');

    expect(submitButton).toBeDisabled();
    expect(mockUpdateSongById).not.toHaveBeenCalled();
  });

  // Submit with valid ID but no update fields
  test('PASSES: Prevents submission with no update fields', async () => {
    const user = userEvent.setup();

    render(<SongUpdate />);

    const idInput = screen.getByPlaceholderText(/enter song id/i);
    const submitButton = screen.getByRole('button', { name: /update/i });

    await user.type(idInput, '507f1f77bcf86cd799439011');

    expect(submitButton).toBeDisabled();
    expect(mockUpdateSongById).not.toHaveBeenCalled();
  });

// Submit with valid ID and updates
test('PASSES: Handles successful update properly', async () => {
  const user = userEvent.setup();
  
  // Add a small delay to make the loading state observable
  mockUpdateSongById.mockImplementation(async (id, data, signal) => {
    await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
    return {
      _id: '507f1f77bcf86cd799439011',
      title: 'Updated Song',
      artist: 'Test Artist',
      album: 'Test Album',
      genre: 'Rock',
    };
  });

  render(<SongUpdate />);

  const idInput = screen.getByPlaceholderText(/enter song id/i);
  const titleInput = screen.getByPlaceholderText(/enter song title/i);
  const submitButton = screen.getByRole('button', { name: /update/i });

  await user.type(idInput, '507f1f77bcf86cd799439011');
  await user.type(titleInput, '  Untrimmed Title  ');

  expect(submitButton).not.toBeDisabled();

  await user.click(submitButton);

  // Check loading state appears (check synchronously right after click)
  expect(screen.getByText(/updating song/i)).toBeInTheDocument();

  // Wait for API call
  await waitFor(() => {
    expect(mockUpdateSongById).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      { title: 'Untrimmed Title' },
      expect.any(AbortSignal)
    );
  });

  // Check success message
  await waitFor(() => {
    expect(screen.getByText(/song updated successfully/i)).toBeInTheDocument();
  });

  // Check form cleared
  expect(idInput).toHaveValue('');
  expect(titleInput).toHaveValue('');
});


  // Edit fields after success
  test('PASSES: Clears success message when editing after success', async () => {
    const user = userEvent.setup();
    
    mockUpdateSongById.mockResolvedValueOnce({
      _id: '507f1f77bcf86cd799439011',
      title: 'Test',
      artist: '',
      album: '',
      genre: '',
    });

    render(<SongUpdate />);

    const idInput = screen.getByPlaceholderText(/enter song id/i);
    const titleInput = screen.getByPlaceholderText(/enter song title/i);

    await user.type(idInput, '507f1f77bcf86cd799439011');
    await user.type(titleInput, 'Test Song');
    await user.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(screen.getByText(/song updated successfully/i)).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText(/enter song id/i), '507f1f77bcf86cd799439011');
    await user.type(screen.getByPlaceholderText(/enter song title/i), 'Modified');

    expect(screen.queryByText(/song updated successfully/i)).not.toBeInTheDocument();
  });

  // Proper payload structure
  test('PASSES: Sends only non-empty fields in payload', async () => {
    const user = userEvent.setup();
    
    mockUpdateSongById.mockResolvedValueOnce({
      _id: '507f1f77bcf86cd799439011',
      title: 'Only Title',
      artist: '',
      album: '',
      genre: '',
    });

    render(<SongUpdate />);

    const idInput = screen.getByPlaceholderText(/enter song id/i);
    const titleInput = screen.getByPlaceholderText(/enter song title/i);

    await user.type(idInput, '507f1f77bcf86cd799439011');
    await user.type(titleInput, 'Only Title');
    await user.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(mockUpdateSongById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { title: 'Only Title' },
        expect.any(AbortSignal)
      );
    });

    const callArgs = mockUpdateSongById.mock.calls[0][1];
    expect(Object.keys(callArgs)).toHaveLength(1);
    expect(callArgs).toEqual({ title: 'Only Title' });
  });

  // Unmount component during request
  test('PASSES: Handles component unmount during request', async () => {
    const user = userEvent.setup();
    
    const abortSpy = jest.fn();
    mockUpdateSongById.mockImplementation((id, data, signal) => {
      signal?.addEventListener('abort', abortSpy);
      return new Promise((resolve) => setTimeout(() => resolve({
        _id: id,
        title: '',
        artist: '',
        album: '',
        genre: '',
      }), 1000));
    });

    const { unmount } = render(<SongUpdate />);

    await user.type(screen.getByPlaceholderText(/enter song id/i), '507f1f77bcf86cd799439011');
    await user.type(screen.getByPlaceholderText(/enter song title/i), 'Test');
    await user.click(screen.getByRole('button', { name: /update/i }));

    expect(mockUpdateSongById).toHaveBeenCalled();

    unmount();

    await waitFor(() => {
      expect(abortSpy).toHaveBeenCalled();
    });
  });

  // Handle 404 error
  test('PASSES: Displays 404 error in UI', async () => {
    const user = userEvent.setup();
    
    const error = new SongServiceError('Song not found. Please check the ID and try again.', 404);
    mockUpdateSongById.mockRejectedValueOnce(error);

    render(<SongUpdate />);

    await user.type(screen.getByPlaceholderText(/enter song id/i), '507f1f77bcf86cd799439011');
    await user.type(screen.getByPlaceholderText(/enter song title/i), 'Test');
    await user.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(screen.getByText(/song not found/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // Handle 400 error
  test('PASSES: Displays 400 validation error in UI', async () => {
    const user = userEvent.setup();
    
    const error = new SongServiceError('Invalid input. Please check your data and try again.', 400);
    mockUpdateSongById.mockRejectedValueOnce(error);

    render(<SongUpdate />);

    await user.type(screen.getByPlaceholderText(/enter song id/i), '507f1f77bcf86cd799439011');
    await user.type(screen.getByPlaceholderText(/enter song title/i), 'Test');
    await user.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid input/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // Loading state
  test('PASSES: Shows loading state during submission', async () => {
    const user = userEvent.setup();
    
    mockUpdateSongById.mockImplementation(() => 
      new Promise((resolve) => setTimeout(() => resolve({
        _id: '507f1f77bcf86cd799439011',
        title: 'Test',
        artist: '',
        album: '',
        genre: '',
      }), 100))
    );

    render(<SongUpdate />);

    await user.type(screen.getByPlaceholderText(/enter song id/i), '507f1f77bcf86cd799439011');
    await user.type(screen.getByPlaceholderText(/enter song title/i), 'Test');
    const submitButton = screen.getByRole('button', { name: /update/i });
    
    await user.click(submitButton);

    expect(screen.getByText(/updating song/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/updating/i);
    expect(screen.getByPlaceholderText(/enter song id/i)).toBeDisabled();
    expect(screen.getByPlaceholderText(/enter song title/i)).toBeDisabled();
  });

  // Button disabled state with invalid ID
  test('PASSES: Disables button when ID is invalid', async () => {
    const user = userEvent.setup();

    render(<SongUpdate />);

    const idInput = screen.getByPlaceholderText(/enter song id/i);
    const titleInput = screen.getByPlaceholderText(/enter song title/i);
    const submitButton = screen.getByRole('button', { name: /update/i });

    await user.type(idInput, 'short');
    await user.type(titleInput, 'Test');

    expect(submitButton).toBeDisabled();
  });

  // Accessibility attributes
  test('PASSES: Has proper accessibility attributes', async () => {
    const user = userEvent.setup();

    render(<SongUpdate />);

    const idInput = screen.getByPlaceholderText(/enter song id/i);

    expect(idInput).toHaveAttribute('required');
    expect(idInput).toHaveAttribute('aria-required', 'true');

    await user.type(idInput, 'invalid');

    expect(idInput).toHaveAttribute('aria-invalid', 'true');
  });

  // Multiple field updates
  test('PASSES: Handles multiple field updates correctly', async () => {
    const user = userEvent.setup();
    
    mockUpdateSongById.mockResolvedValueOnce({
      _id: '507f1f77bcf86cd799439011',
      title: 'New Title',
      artist: 'New Artist',
      album: 'New Album',
      genre: 'Jazz',
    });

    render(<SongUpdate />);

    await user.type(screen.getByPlaceholderText(/enter song id/i), '507f1f77bcf86cd799439011');
    await user.type(screen.getByPlaceholderText(/enter song title/i), 'New Title');
    await user.type(screen.getByPlaceholderText(/enter artist name/i), 'New Artist');
    await user.type(screen.getByPlaceholderText(/enter album name/i), '  New Album  ');
    await user.type(screen.getByPlaceholderText(/enter genre/i), 'Jazz');

    await user.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(mockUpdateSongById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {
          title: 'New Title',
          artist: 'New Artist',
          album: 'New Album',
          genre: 'Jazz',
        },
        expect.any(AbortSignal)
      );
    });
  });

  // Error message clears when fixing input
  test('PASSES: Clears error when user edits field', async () => {
    const user = userEvent.setup();
    
    const error = new SongServiceError('Song not found. Please check the ID and try again.', 404);
    mockUpdateSongById.mockRejectedValueOnce(error);

    render(<SongUpdate />);

    await user.type(screen.getByPlaceholderText(/enter song id/i), '507f1f77bcf86cd799439011');
    await user.type(screen.getByPlaceholderText(/enter song title/i), 'Test');
    await user.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(screen.getByText(/song not found/i)).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText(/enter song title/i), 'Modified');

    expect(screen.queryByText(/song not found/i)).not.toBeInTheDocument();
  });
});
