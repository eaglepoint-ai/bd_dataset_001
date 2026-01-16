import { useState, useEffect, useCallback, useRef } from 'react';
interface SearchResult {
    id: string;
    title: string;
    description: string;
}

interface UseSearchOptions {
    debounceMs?: number;
}

interface UseSearchReturn {
    query: string;
    setQuery: (query: string) => void;
    results: SearchResult[];
    isLoading: boolean;
    error: string | null;
}

export function useSearch(
    initialQuery: string = '',
    options: UseSearchOptions = {}
): UseSearchReturn {
    const { debounceMs = 300 } = options;

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const timeoutRef = useRef<number | null>(null);
    const latestRequestIdRef = useRef(0);
    const isMountedRef = useRef(true);

    const performSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const controller = new AbortController();
            const signal = controller.signal;

            const requestId = ++latestRequestIdRef.current;

            const response = await fetch(
                `/api/search?q=${encodeURIComponent(searchQuery)}`,
                { signal }
            );

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            if (isMountedRef.current && requestId === latestRequestIdRef.current) {
                setResults(data.results);
            }
        } catch (err) {
            if (isMountedRef.current) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    const debouncedSearch = useCallback((searchTerm: string) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
            performSearch(searchTerm);
            timeoutRef.current = null;
        }, debounceMs);
    }, [debounceMs]);

    useEffect(() => {
        debouncedSearch(query);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [query, debouncedSearch]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return {
        query,
        setQuery,
        results,
        isLoading,
        error,
    };
}

