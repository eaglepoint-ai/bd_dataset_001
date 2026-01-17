import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import UpdateForm from '../repository_before/SongUpdate';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('UpdateForm - Before Refactor (Expected Failures)', () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
    consoleLogSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  // Submit with empty ID
  test('FAILS: Allows submission with empty ID (should prevent)', async () => {
    const user = userEvent.setup();
    mockedAxios.put.mockResolvedValue({ data: {} });

    render(<UpdateForm />);

    const titleInput = screen.getByPlaceholderText(/enter song title/i);
    const submitButton = screen.getByRole('button', { name: /update/i });

    await user.type(titleInput, 'Test Song');
    await user.click(submitButton);

    // FAILS: This assertion will FAIL because it makes the API call
    expect(mockedAxios.put).not.toHaveBeenCalled();
  });

  // Submit with invalid ID format
  test('FAILS: Allows invalid MongoDB ObjectId format (should validate)', async () => {
    const user = userEvent.setup();
    mockedAxios.put.mockResolvedValue({ data: {} });

    render(<UpdateForm />);

    const idInput = screen.getByPlaceholderText(/enter song id/i);
    const titleInput = screen.getByPlaceholderText(/enter song title/i);
    const submitButton = screen.getByRole('button', { name: /update/i });

    await user.type(idInput, 'abc123');
    await user.type(titleInput, 'Test Song');
    await user.click(submitButton);

    // FAILS: This will FAIL because it sends invalid ID
    expect(mockedAxios.put).not.toHaveBeenCalled();
  });

  // Submit with valid ID but no update fields
  test('FAILS: Allows submission with no update fields (should prevent)', async () => {
    const user = userEvent.setup();
    mockedAxios.put.mockResolvedValue({ data: {} });

    render(<UpdateForm />);

    const idInput = screen.getByPlaceholderText(/enter song id/i);
    const submitButton = screen.getByRole('button', { name: /update/i });

    await user.type(idInput, '507f1f77bcf86cd799439011');
    await user.click(submitButton);

    // FAILS: This will FAIL because it sends empty payload
    expect(mockedAxios.put).not.toHaveBeenCalled();
  });

  // Submit with valid ID and updates
  test('FAILS: Does not trim whitespace from input (should trim)', async () => {
    const user = userEvent.setup();
    mockedAxios.put.mockResolvedValue({
      data: {
        _id: '507f1f77bcf86cd799439011',
        title: 'Updated Song',
        artist: 'Test Artist',
        album: 'Test Album',
        genre: 'Rock',
      },
    });

    render(<UpdateForm />);

    const idInput = screen.getByPlaceholderText(/enter song id/i);
    const titleInput = screen.getByPlaceholderText(/enter song title/i);

    await user.type(idInput, '507f1f77bcf86cd799439011');
    await user.type(titleInput, '  Untrimmed Title  ');
    await user.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalled();
    });

    // FAILS: This will FAIL because it doesn't trim
    expect(mockedAxios.put).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        title: 'Untrimmed Title', // Expect trimmed, but gets untrimmed
      })
    );
  });

  // Edit fields after success
  test('FAILS: Does not clear success message when editing (should clear)', async () => {
    const user = userEvent.setup();
    mockedAxios.put.mockResolvedValue({ data: {} });

    render(<UpdateForm />);

    const idInput = screen.getByPlaceholderText(/enter song id/i);
    const titleInput = screen.getByPlaceholderText(/enter song title/i);

    await user.type(idInput, '507f1f77bcf86cd799439011');
    await user.type(titleInput, 'Test Song');
    await user.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(screen.getByText(/song updated successfully/i)).toBeInTheDocument();
    });

    await user.type(titleInput, 'Modified');

    // FAILS: This will FAIL because success message persists
    expect(screen.queryByText(/song updated successfully/i)).not.toBeInTheDocument();
  });

  // Handle 404 error
  test('FAILS: Does not display 404 error in UI (should show error)', async () => {
    const user = userEvent.setup();
    mockedAxios.put.mockRejectedValue({
      response: {
        status: 404,
        data: { message: 'Song not found' },
      },
    });

    render(<UpdateForm />);

    await user.type(screen.getByPlaceholderText(/enter song id/i), '507f1f77bcf86cd799439011');
    await user.type(screen.getByPlaceholderText(/enter song title/i), 'Test');
    await user.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalled();
    });

    // FAILS: This will FAIL because no error shown in UI
    expect(screen.getByText(/song not found/i)).toBeInTheDocument();
  });

  // Loading state
  test('FAILS: Does not show loading state during submission (should show)', async () => {
    const user = userEvent.setup();
    mockedAxios.put.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 100))
    );

    render(<UpdateForm />);

    await user.type(screen.getByPlaceholderText(/enter song id/i), '507f1f77bcf86cd799439011');
    await user.type(screen.getByPlaceholderText(/enter song title/i), 'Test');
    await user.click(screen.getByRole('button', { name: /update/i }));

    // FAILS: This will FAIL because no loading indicator
    expect(screen.getByText(/updating/i)).toBeInTheDocument();
  });

  // Button disabled state
  test('FAILS: Does not disable button with invalid ID (should disable)', async () => {
    const user = userEvent.setup();

    render(<UpdateForm />);

    const idInput = screen.getByPlaceholderText(/enter song id/i);
    const titleInput = screen.getByPlaceholderText(/enter song title/i);
    const submitButton = screen.getByRole('button', { name: /update/i });

    await user.type(idInput, 'short');
    await user.type(titleInput, 'Test');

    // FAILS: This will FAIL because button is not disabled
    expect(submitButton).toBeDisabled();
  });

  // Accessibility
  test('FAILS: Missing proper accessibility attributes (should have)', async () => {
    const user = userEvent.setup();

    render(<UpdateForm />);

    const idInput = screen.getByPlaceholderText(/enter song id/i);

    // FAILS: This will FAIL if attributes missing
    expect(idInput).toHaveAttribute('aria-required', 'true');
  });

  // Unmount handling
  test('FAILS: Does not cancel request on unmount (should cancel)', async () => {
    const user = userEvent.setup();
    
    const abortSpy = jest.fn();
    mockedAxios.put.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 1000))
    );

    const { unmount } = render(<UpdateForm />);

    await user.type(screen.getByPlaceholderText(/enter song id/i), '507f1f77bcf86cd799439011');
    await user.type(screen.getByPlaceholderText(/enter song title/i), 'Test');
    await user.click(screen.getByRole('button', { name: /update/i }));

    unmount();

    // FAILS: This will FAIL because no abort signal used
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ signal: expect.any(Object) })
      );
    });
  });
});
