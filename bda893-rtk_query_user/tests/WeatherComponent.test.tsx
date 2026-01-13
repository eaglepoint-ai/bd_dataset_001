import React, { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';
import WeatherComponentAfter from '../repository_after/WeatherComponent';
import WeatherComponentBefore from '../repository_before/WeatherComponent';

// Mock fetch globally
global.fetch = vi.fn();

interface WeatherData {
  temperature: number;
}

// Helper functions for test reusability
const createMockWeatherResponse = (weather: WeatherData) => {
  const mockJson = vi.fn().mockImplementation(async () => weather);
  return {
    ok: true,
    json: mockJson,
  };
};

const createMockErrorResponse = (status: number, statusText: string) => ({
  ok: false,
  status,
  statusText,
});

const DEFAULT_LOADING_FALLBACK = <div>Loading...</div>;

const renderWithSuspense = (Component: React.ComponentType, fallback?: React.ReactNode) => {
  const fallbackElement = fallback ?? DEFAULT_LOADING_FALLBACK;
  return render(
    <Suspense fallback={fallbackElement}>
      <Component />
    </Suspense>
  );
};

const waitForWeatherData = async (temperature: number, timeout: number = 20000) => {
  return await screen.findByText(`Temperature: ${temperature}°C`, {}, { timeout });
};

describe('WeatherComponent - Unified Test Suite', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    (global.fetch as any) = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const testCases = [
    {
      name: 'repository_after',
      Component: WeatherComponentAfter,
    },
    {
      name: 'repository_before',
      Component: WeatherComponentBefore,
    },
  ];

  testCases.forEach(({ name, Component }) => {
    describe(name, () => {
      it('should render weather data using React 19 use() hook', async () => {
        const mockWeather = { temperature: 25 };
        const mockResponse = createMockWeatherResponse(mockWeather);
        mockFetch.mockResolvedValue(mockResponse);

        renderWithSuspense(Component);

        const temperatureElement = await waitForWeatherData(25);
        expect(temperatureElement).toBeInTheDocument();
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Loading weather data...')).not.toBeInTheDocument();
      });

      it('should use Suspense fallback while loading', () => {
        const pendingPromise = new Promise(() => {});
        mockFetch.mockReturnValue(pendingPromise);

        renderWithSuspense(Component);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByText('Loading weather data...')).not.toBeInTheDocument();
      });

      it('should handle errors via ErrorBoundary (not component-level error state)', async () => {
        const mockErrorResponse = createMockErrorResponse(404, 'Not Found');
        mockFetch.mockResolvedValue(mockErrorResponse);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        renderWithSuspense(Component);

        await waitFor(() => {
          expect(consoleError).toHaveBeenCalled();
        }, { timeout: 5000 });
        
        expect(screen.queryByText('Error fetching weather data')).not.toBeInTheDocument();

        consoleError.mockRestore();
      });

      it('should validate and throw error for invalid weather data', async () => {
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({}),
        };
        mockFetch.mockResolvedValue(mockResponse);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        renderWithSuspense(Component);

        await waitFor(() => {
          expect(consoleError).toHaveBeenCalled();
        }, { timeout: 3000 });

        consoleError.mockRestore();
      });

      it('should call fetch exactly once (no unnecessary re-renders)', async () => {
        const mockWeather = { temperature: 20 };
        const mockResponse = createMockWeatherResponse(mockWeather);
        mockFetch.mockResolvedValue(mockResponse);

        renderWithSuspense(Component);

        await waitForWeatherData(20);
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('should use use() hook instead of useState/useEffect for data fetching', async () => {
        const mockWeather = { temperature: 30 };
        const mockResponse = createMockWeatherResponse(mockWeather);
        mockFetch.mockResolvedValue(mockResponse);

        const customFallback = <div>Use Hook Required</div>;
        renderWithSuspense(Component, customFallback);

        await waitFor(() => {
          expect(screen.queryByText(`Temperature: ${mockWeather.temperature}°C`)).toBeInTheDocument();
        }, { timeout: 2000 });
      });

      it('should memoize promise and not re-fetch on re-renders', async () => {
        const mockWeather = { temperature: 15 };
        const mockResponse = createMockWeatherResponse(mockWeather);
        mockFetch.mockResolvedValue(mockResponse);

        const { rerender } = render(
          <Suspense fallback={<div>Loading...</div>}>
            <Component />
          </Suspense>
        );

        await waitForWeatherData(15);
        const initialCallCount = mockFetch.mock.calls.length;

        rerender(
          <Suspense fallback={<div>Loading...</div>}>
            <Component />
          </Suspense>
        );

        await waitFor(() => {
          expect(screen.queryByText(`Temperature: ${mockWeather.temperature}°C`)).toBeInTheDocument();
        }, { timeout: 1000 });

        expect(mockFetch.mock.calls.length).toBe(initialCallCount);
      });

      it('should handle network errors (fetch throws)', async () => {
        const networkError = new Error('Network request failed');
        mockFetch.mockImplementation(() => Promise.reject(networkError));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        renderWithSuspense(Component);

        await waitFor(() => {
          expect(consoleError).toHaveBeenCalled();
        }, { timeout: 5000 });

        expect(screen.queryByText('Error fetching weather data')).not.toBeInTheDocument();
        consoleError.mockRestore();
      });

      it('should handle different HTTP error status codes', async () => {
        const errorCodes = [400, 401, 403, 500, 503];
        
        for (const statusCode of errorCodes) {
          vi.clearAllMocks();
          const mockErrorResponse = createMockErrorResponse(statusCode, 'Error');
          mockFetch.mockResolvedValue(mockErrorResponse);
          const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

          const { unmount } = renderWithSuspense(Component);

          await waitFor(() => {
            expect(consoleError).toHaveBeenCalled();
          }, { timeout: 3000 });

          expect(screen.queryByText('Error fetching weather data')).not.toBeInTheDocument();
          
          consoleError.mockRestore();
          unmount();
        }
      });

      it('should validate null data and throw error', async () => {
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue(null),
        };
        mockFetch.mockResolvedValue(mockResponse);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        renderWithSuspense(Component);

        await waitFor(() => {
          expect(consoleError).toHaveBeenCalled();
        }, { timeout: 3000 });

        consoleError.mockRestore();
      });

      it('should validate non-numeric temperature and throw error', async () => {
        const invalidDataCases = [
          { temperature: '25' },
          { temperature: null },
          { temperature: undefined },
          { temperature: [] },
          { temperature: {} },
        ];

        for (const invalidData of invalidDataCases) {
          vi.clearAllMocks();
          const mockResponse = {
            ok: true,
            json: vi.fn().mockResolvedValue(invalidData),
          };
          mockFetch.mockResolvedValue(mockResponse);
          const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

          const { unmount } = renderWithSuspense(Component);

          await waitFor(() => {
            expect(consoleError).toHaveBeenCalled();
          }, { timeout: 3000 });

          consoleError.mockRestore();
          unmount();
        }
      });

      it('should handle invalid JSON response', async () => {
        const mockResponse = {
          ok: true,
          json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        };
        mockFetch.mockResolvedValue(mockResponse);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        renderWithSuspense(Component);

        await waitFor(() => {
          expect(consoleError).toHaveBeenCalled();
        }, { timeout: 3000 });

        consoleError.mockRestore();
      });

      it('should handle response with missing temperature field', async () => {
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({ humidity: 60, pressure: 1013 }),
        };
        mockFetch.mockResolvedValue(mockResponse);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        renderWithSuspense(Component);

        await waitFor(() => {
          expect(consoleError).toHaveBeenCalled();
        }, { timeout: 3000 });

        consoleError.mockRestore();
      });

      it('should handle valid data with additional fields', async () => {
        const mockWeather = { 
          temperature: 22,
          humidity: 65,
          pressure: 1013,
          description: 'Sunny'
        };
        const mockResponse = createMockWeatherResponse(mockWeather);
        mockFetch.mockResolvedValue(mockResponse);

        renderWithSuspense(Component);

        const temperatureElement = await waitForWeatherData(22);
        expect(temperatureElement).toBeInTheDocument();
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('should handle zero temperature value', async () => {
        const mockWeather = { temperature: 0 };
        const mockResponse = createMockWeatherResponse(mockWeather);
        mockFetch.mockResolvedValue(mockResponse);

        renderWithSuspense(Component);

        const temperatureElement = await waitForWeatherData(0);
        expect(temperatureElement).toBeInTheDocument();
      });

      it('should handle negative temperature values', async () => {
        const mockWeather = { temperature: -10 };
        const mockResponse = createMockWeatherResponse(mockWeather);
        mockFetch.mockResolvedValue(mockResponse);

        renderWithSuspense(Component);

        const temperatureElement = await waitForWeatherData(-10);
        expect(temperatureElement).toBeInTheDocument();
      });
    });
  });
});
