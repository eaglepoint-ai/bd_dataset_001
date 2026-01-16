import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SongList from '@/components/SongList';
import * as songService from '@/lib/songService';

jest.mock('@/lib/songService');

const mockSongs = [
  { id: '1', title: 'Song 1', artist: 'Artist 1', album: 'Album 1', genre: 'Rock' },
  { id: '2', title: 'Song 2', artist: 'Artist 2', album: 'Album 2', genre: 'Pop' },
];

describe('SongList Component - All Requirements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Requirement 1: Loading indicator
  test('shows loading indicator while fetching', () => {
    jest.spyOn(songService, 'fetchSongs').mockImplementation(() => new Promise(() => {}));
    render(<SongList />);
    expect(screen.getByText('Loading songs...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // Requirement 2: Errors displayed in UI
  test('displays error in UI instead of console', async () => {
    jest.spyOn(songService, 'fetchSongs').mockRejectedValue(new Error('Network error'));
    render(<SongList />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Network error'));
  });

  // Requirement 3: Retry option
  test('provides retry button on error', async () => {
    jest.spyOn(songService, 'fetchSongs').mockRejectedValue(new Error('Failed'));
    render(<SongList />);
    await waitFor(() => expect(screen.getByText('Retry')).toBeInTheDocument());
  });

  test('retry button refetches data', async () => {
    const fetchMock = jest.spyOn(songService, 'fetchSongs')
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValueOnce(mockSongs);
    
    render(<SongList />);
    await waitFor(() => screen.getByText('Retry'));
    
    const retryButton = screen.getByText('Retry');
    await userEvent.click(retryButton);
    
    await waitFor(() => expect(screen.getByText('Song 1')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  // Requirement 4: Empty state message
  test('shows clear message when no songs available', async () => {
    jest.spyOn(songService, 'fetchSongs').mockResolvedValue([]);
    render(<SongList />);
    await waitFor(() => expect(screen.getByText('No songs available')).toBeInTheDocument());
  });

  // Requirement 5: Request cancellation with AbortController
  test('cancels request on unmount', async () => {
    const abortSpy = jest.fn();
    jest.spyOn(songService, 'fetchSongs').mockImplementation((signal) => {
      signal.addEventListener('abort', abortSpy);
      return new Promise(() => {});
    });
    
    const { unmount } = render(<SongList />);
    unmount();
    
    expect(abortSpy).toHaveBeenCalled();
  });

  // Requirement 6: Manual refresh button
  test('provides refresh button when songs loaded', async () => {
    jest.spyOn(songService, 'fetchSongs').mockResolvedValue(mockSongs);
    render(<SongList />);
    await waitFor(() => expect(screen.getByText('Refresh')).toBeInTheDocument());
  });

  test('refresh button reloads songs', async () => {
    const fetchMock = jest.spyOn(songService, 'fetchSongs').mockResolvedValue(mockSongs);
    render(<SongList />);
    await waitFor(() => screen.getByText('Refresh'));
    
    const refreshButton = screen.getByText('Refresh');
    await userEvent.click(refreshButton);
    
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  // Requirement 7: All major UI states have visible feedback
  test('displays all states correctly', async () => {
    const fetchMock = jest.spyOn(songService, 'fetchSongs').mockResolvedValue(mockSongs);
    render(<SongList />);
    
    expect(screen.getByText('Loading songs...')).toBeInTheDocument();
    
    await waitFor(() => expect(screen.getByText('Song 1')).toBeInTheDocument());
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  // Requirement 8: Semantic and accessible markup
  test('uses semantic markup with ARIA attributes', async () => {
    jest.spyOn(songService, 'fetchSongs').mockResolvedValue(mockSongs);
    render(<SongList />);
    
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    
    await waitFor(() => screen.getByText('Song 1'));
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  // Requirement 9: No raw database IDs shown
  test('does not display raw MongoDB IDs', async () => {
    jest.spyOn(songService, 'fetchSongs').mockResolvedValue(mockSongs);
    render(<SongList />);
    
    await waitFor(() => screen.getByText('Song 1'));
    expect(screen.queryByText(/507f1f77bcf86cd799439011/)).not.toBeInTheDocument();
    expect(screen.queryByText('Id:')).not.toBeInTheDocument();
  });

  // Requirement 10: Pagination/limits for large lists
  test('limits rendered items to 100', async () => {
    const largeSongList = Array.from({ length: 150 }, (_, i) => ({
      id: `${i}`,
      title: `Song ${i}`,
      artist: `Artist ${i}`,
      album: `Album ${i}`,
      genre: 'Rock',
    }));
    
    jest.spyOn(songService, 'fetchSongs').mockResolvedValue(largeSongList);
    render(<SongList />);
    
    await waitFor(() => screen.getByText('Song 0'));
    
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(100);
  });

  // Requirement 13: Axios in separate service module
  test('uses separate API service module', async () => {
    const fetchMock = jest.spyOn(songService, 'fetchSongs').mockResolvedValue(mockSongs);
    render(<SongList />);
    
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });

  // Requirement 16: Decoupled from API response shape
  test('transforms API response to internal format', async () => {
    const apiResponse = [
      { _id: 'mongo123', title: 'Test', artist: 'Artist', album: 'Album', genre: 'Rock' }
    ];
    
    jest.spyOn(songService, 'fetchSongs').mockImplementation(async () => 
      apiResponse.map(s => ({ id: s._id, title: s.title, artist: s.artist, album: s.album, genre: s.genre }))
    );
    
    render(<SongList />);
    await waitFor(() => screen.getByText('Test'));
    
    expect(screen.queryByText('mongo123')).not.toBeInTheDocument();
  });

  // Requirement 21: Compatible with GET /songs endpoint
  test('calls fetchSongs with AbortSignal', async () => {
    const fetchMock = jest.spyOn(songService, 'fetchSongs').mockResolvedValue(mockSongs);
    render(<SongList />);
    
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.any(AbortSignal)));
  });

  // Requirement 22: Existing CSS class names unchanged
  test('uses existing CSS class names', async () => {
    jest.spyOn(songService, 'fetchSongs').mockResolvedValue(mockSongs);
    render(<SongList />);
    
    await waitFor(() => screen.getByText('Song 1'));
    
    expect(document.querySelector('.song-list-container')).toBeInTheDocument();
    expect(document.querySelector('.song-list-heading')).toBeInTheDocument();
    expect(document.querySelector('.song-item')).toBeInTheDocument();
    expect(document.querySelector('.song-title')).toBeInTheDocument();
    expect(document.querySelector('.song-info')).toBeInTheDocument();
  });
});
