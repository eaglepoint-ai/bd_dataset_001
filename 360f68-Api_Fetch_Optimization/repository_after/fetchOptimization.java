import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

public class FetchOptimization {
    
    /**
     * Fetches unique items from a list, preserving insertion order.
     * Optimized to O(n) time complexity using LinkedHashSet.
     * 
     * @param items The input list of items
     * @return A list of unique items preserving insertion order
     * @throws IllegalArgumentException if items is null
     */
    public static List<Object> fetchItems(List<Object> items) {
        // Validate input
        if (items == null) {
            throw new IllegalArgumentException("Input list cannot be null");
        }
        
        // Use LinkedHashSet for O(n) duplicate removal while preserving insertion order
        LinkedHashSet<Object> uniqueSet = new LinkedHashSet<>(items);
        return new ArrayList<>(uniqueSet);
    }
    
    /**
     * Fetches unique items from a list with optional pagination support.
     * Optimized to O(n) time complexity using LinkedHashSet.
     * 
     * @param items The input list of items
     * @param page The 1-based page number (must be positive)
     * @param pageSize The number of items per page (must be positive)
     * @return A paginated list of unique items preserving insertion order
     * @throws IllegalArgumentException if items is null, or if pagination parameters are invalid
     */
    public static List<Object> fetchItems(List<Object> items, Integer page, Integer pageSize) {
        // Validate input list
        if (items == null) {
            throw new IllegalArgumentException("Input list cannot be null");
        }
        
        // Validate pagination parameters
        if (page == null && pageSize == null) {
            // No pagination requested, return all unique items
            return fetchItems(items);
        }
        
        // Both pagination parameters must be provided together
        if (page == null || pageSize == null) {
            throw new IllegalArgumentException("Both page and pageSize must be provided together, or both must be null");
        }
        
        // Validate pagination parameters are positive integers
        if (page <= 0) {
            throw new IllegalArgumentException("Page must be a positive integer (1-based indexing)");
        }
        
        if (pageSize <= 0) {
            throw new IllegalArgumentException("Page size must be a positive integer");
        }
        
        // Get unique items preserving insertion order (O(n))
        LinkedHashSet<Object> uniqueSet = new LinkedHashSet<>(items);
        List<Object> uniqueList = new ArrayList<>(uniqueSet);
        
        // Calculate pagination bounds (1-based indexing)
        int startIndex = (page - 1) * pageSize;
        int endIndex = startIndex + pageSize;
        
        // Return empty list if page is out of range
        if (startIndex >= uniqueList.size()) {
            return new ArrayList<>();
        }
        
        // Adjust endIndex to not exceed list size
        endIndex = Math.min(endIndex, uniqueList.size());
        
        // Return paginated sublist
        return new ArrayList<>(uniqueList.subList(startIndex, endIndex));
    }
}
