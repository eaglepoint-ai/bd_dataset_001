import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearch } from './useSearch';

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  mockFetch.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useSearch Hook', () => {
  
  describe('Debouncing', () => {
    it('should debounce API calls - only one call after typing stops', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [{ id: '1', title: 'result', description: '' }] }),
      });

      const { result } = renderHook(() => useSearch());

      act(() => { result.current.setQuery('r'); });
      act(() => { result.current.setQuery('re'); });
      act(() => { result.current.setQuery('rea'); });
      act(() => { result.current.setQuery('reac'); });
      act(() => { result.current.setQuery('react'); });

      expect(mockFetch).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(350);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/search?q=react',
        expect.any(Object)
      );
    });
  });

  describe('Correct Search Term', () => {
    it('should send the actual typed query, not stale value', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      const { result } = renderHook(() => useSearch());

      act(() => { result.current.setQuery('laptop'); });

      await act(async () => {
        jest.advanceTimersByTime(350);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/search?q=laptop',
        expect.any(Object)
      );
    });
  });

  describe('Race Condition Handling', () => {
    it('should only show results from the latest request', async () => {
      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;

      const firstPromise = new Promise(resolve => { resolveFirst = resolve; });
      const secondPromise = new Promise(resolve => { resolveSecond = resolve; });

      mockFetch
        .mockImplementationOnce(() => Promise.resolve({ 
          ok: true, 
          json: () => firstPromise 
        }))
        .mockImplementationOnce(() => Promise.resolve({ 
          ok: true, 
          json: () => secondPromise 
        }));

      const { result } = renderHook(() => useSearch());

      act(() => { result.current.setQuery('react'); });
      await act(async () => { jest.advanceTimersByTime(350); });

      act(() => { result.current.setQuery('reactjs'); });
      await act(async () => { jest.advanceTimersByTime(350); });

      await act(async () => {
        resolveSecond!({ results: [{ id: '2', title: 'reactjs-result', description: '' }] });
      });

      await act(async () => {
        resolveFirst!({ results: [{ id: '1', title: 'react-result', description: '' }] });
      });

      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });

      expect(result.current.results[0]?.title).toBe('reactjs-result');
    });
  });

  describe('Subsequent Queries', () => {
    it('should update results on multiple consecutive queries', async () => {
      const { result } = renderHook(() => useSearch());

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [{ id: '1', title: 'first-result', description: '' }] }),
      });

      act(() => { result.current.setQuery('first'); });
      await act(async () => { jest.advanceTimersByTime(350); });

      await waitFor(() => {
        expect(result.current.results[0]?.title).toBe('first-result');
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [{ id: '2', title: 'second-result', description: '' }] }),
      });

      act(() => { result.current.setQuery('second'); });
      await act(async () => { jest.advanceTimersByTime(350); });

      await waitFor(() => {
        expect(result.current.results[0]?.title).toBe('second-result');
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [{ id: '3', title: 'third-result', description: '' }] }),
      });

      act(() => { result.current.setQuery('third'); });
      await act(async () => { jest.advanceTimersByTime(350); });

      await waitFor(() => {
        expect(result.current.results[0]?.title).toBe('third-result');
      });
    });
  });

  describe('Empty Query Handling', () => {
    it('should clear results for empty query without API call', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [{ id: '1', title: 'test', description: '' }] }),
      });

      const { result } = renderHook(() => useSearch());

      act(() => { result.current.setQuery('test'); });
      await act(async () => { jest.advanceTimersByTime(350); });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(1);
      });

      const callsBefore = mockFetch.mock.calls.length;

      act(() => { result.current.setQuery(''); });
      await act(async () => { jest.advanceTimersByTime(350); });

      expect(result.current.results).toEqual([]);
      expect(mockFetch.mock.calls.length).toBe(callsBefore);
    });
  });

  describe('Loading State', () => {
    it('should accurately reflect loading state', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => { resolvePromise = resolve; });

      mockFetch.mockImplementation(() => Promise.resolve({
        ok: true,
        json: () => promise,
      }));

      const { result } = renderHook(() => useSearch());

      expect(result.current.isLoading).toBe(false);

      act(() => { result.current.setQuery('test'); });
      await act(async () => { jest.advanceTimersByTime(350); });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({ results: [] });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Cleanup', () => {
    it('should not cause warnings when unmounting during search', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => { resolvePromise = resolve; });

      mockFetch.mockImplementation(() => Promise.resolve({
        ok: true,
        json: () => promise,
      }));

      const { result, unmount } = renderHook(() => useSearch());

      act(() => { result.current.setQuery('test'); });
      await act(async () => { jest.advanceTimersByTime(350); });

      unmount();

      await act(async () => {
        resolvePromise!({ results: [{ id: '1', title: 'test', description: '' }] });
      });

      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining("Can't perform a React state update")
      );

      consoleError.mockRestore();
    });
  });
});

