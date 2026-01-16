import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SongList from '../repository_after/SongList';
import * as songService from '../repository_after/services/songService';

jest.mock('../repository_after/services/songService');

describe('SongList Component', () => {
  it('shows loading state', () => {
    jest.spyOn(songService, 'fetchSongs').mockImplementation(() => new Promise(() => {}));
    render(<SongList />);
    expect(screen.getByText('Loading songs...')).toBeInTheDocument();
  });

  it('displays songs after loading', async () => {
    jest.spyOn(songService, 'fetchSongs').mockResolvedValue([
      { id: '1', title: 'Test Song', artist: 'Test Artist', album: 'Test Album', genre: 'Rock' }
    ]);
    render(<SongList />);
    await waitFor(() => expect(screen.getByText('Test Song')).toBeInTheDocument());
  });

  it('shows error message on failure', async () => {
    jest.spyOn(songService, 'fetchSongs').mockRejectedValue(new Error('Network error'));
    render(<SongList />);
    await waitFor(() => expect(screen.getByText(/Network error/)).toBeInTheDocument());
  });

  it('shows empty state when no songs', async () => {
    jest.spyOn(songService, 'fetchSongs').mockResolvedValue([]);
    render(<SongList />);
    await waitFor(() => expect(screen.getByText('No songs available')).toBeInTheDocument());
  });
});
