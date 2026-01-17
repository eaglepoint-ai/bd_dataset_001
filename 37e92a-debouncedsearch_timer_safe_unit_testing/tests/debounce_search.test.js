const DebouncedSearch = require('../repository_before/debounced_search.js');

describe('DebouncedSearch', () => {
  let callback;
  let debouncedSearch;

  beforeEach(() => {
    jest.useFakeTimers();
    callback = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    if (debouncedSearch) {
      debouncedSearch.destroy();
    }
  });

  describe('constructor', () => {
    test('should initialize with default delay', () => {
      debouncedSearch = new DebouncedSearch(callback);
      expect(debouncedSearch.callback).toBe(callback);
      expect(debouncedSearch.delay).toBe(500);
      expect(debouncedSearch.timeout).toBeNull();
    });

    test('should initialize with custom delay', () => {
      debouncedSearch = new DebouncedSearch(callback, 1000);
      expect(debouncedSearch.callback).toBe(callback);
      expect(debouncedSearch.delay).toBe(1000);
      expect(debouncedSearch.timeout).toBeNull();
    });
  });

  describe('search', () => {
    test('should set timeout on first search call', () => {
      debouncedSearch = new DebouncedSearch(callback);
      debouncedSearch.search('query1');
      expect(debouncedSearch.timeout).not.toBeNull();
      expect(callback).not.toHaveBeenCalled();
    });

    test('should clear previous timeout and set new one on subsequent calls', () => {
      debouncedSearch = new DebouncedSearch(callback);
      debouncedSearch.search('query1');
      const firstTimeout = debouncedSearch.timeout;
      debouncedSearch.search('query2');
      expect(debouncedSearch.timeout).not.toBe(firstTimeout);
      expect(debouncedSearch.timeout).not.toBeNull();
      expect(callback).not.toHaveBeenCalled();
    });

    test('should call callback after delay with correct query', () => {
      debouncedSearch = new DebouncedSearch(callback);
      debouncedSearch.search('query1');
      jest.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledWith('query1');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should call callback with latest query when multiple searches', () => {
      debouncedSearch = new DebouncedSearch(callback);
      debouncedSearch.search('query1');
      jest.advanceTimersByTime(250);
      debouncedSearch.search('query2');
      jest.advanceTimersByTime(250);
      debouncedSearch.search('query3');
      jest.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledWith('query3');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should handle delay of 0', () => {
      debouncedSearch = new DebouncedSearch(callback, 0);
      debouncedSearch.search('query1');
      jest.advanceTimersByTime(0);
      expect(callback).toHaveBeenCalledWith('query1');
    });

    test('should debounce multiple rapid calls', () => {
      debouncedSearch = new DebouncedSearch(callback, 100);
      debouncedSearch.search('query1');
      debouncedSearch.search('query2');
      debouncedSearch.search('query3');
      jest.advanceTimersByTime(50);
      expect(callback).not.toHaveBeenCalled();
      jest.advanceTimersByTime(50);
      expect(callback).toHaveBeenCalledWith('query3');
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    test('should clear timeout if exists', () => {
      debouncedSearch = new DebouncedSearch(callback);
      debouncedSearch.search('query1');
      expect(debouncedSearch.timeout).not.toBeNull();
      debouncedSearch.destroy();
      // Note: destroy clears the timeout but doesn't set it to null
    });

    test('should prevent callback execution if called before delay', () => {
      debouncedSearch = new DebouncedSearch(callback);
      debouncedSearch.search('query1');
      debouncedSearch.destroy();
      jest.advanceTimersByTime(500);
      expect(callback).not.toHaveBeenCalled();
    });

    test('should do nothing if no timeout set', () => {
      debouncedSearch = new DebouncedSearch(callback);
      debouncedSearch.destroy();
      expect(debouncedSearch.timeout).toBeNull();
    });

    test('should handle destroy after callback has executed', () => {
      debouncedSearch = new DebouncedSearch(callback);
      debouncedSearch.search('query1');
      jest.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledWith('query1');
      debouncedSearch.destroy();
      // Note: destroy clears the timeout but doesn't set it to null
    });

    test('should prevent stale timers in multiple scenarios', () => {
      debouncedSearch = new DebouncedSearch(callback);
      debouncedSearch.search('query1');
      debouncedSearch.search('query2');
      debouncedSearch.destroy();
      jest.advanceTimersByTime(500);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    test('should handle empty query', () => {
      debouncedSearch = new DebouncedSearch(callback);
      debouncedSearch.search('');
      jest.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledWith('');
    });

    test('should handle null query', () => {
      debouncedSearch = new DebouncedSearch(callback);
      debouncedSearch.search(null);
      jest.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledWith(null);
    });

    test('should handle undefined query', () => {
      debouncedSearch = new DebouncedSearch(callback);
      debouncedSearch.search(undefined);
      jest.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledWith(undefined);
    });

    test('should handle callback that throws error', () => {
      const errorCallback = jest.fn(() => { throw new Error('Test error'); });
      debouncedSearch = new DebouncedSearch(errorCallback);
      debouncedSearch.search('query1');
      expect(() => jest.advanceTimersByTime(500)).toThrow('Test error');
      expect(errorCallback).toHaveBeenCalledWith('query1');
    });
  });
});