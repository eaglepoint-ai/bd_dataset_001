import static org.junit.Assert.assertEquals;
import org.junit.Test;

public class AdjacentSumTest {

    @Test
	public void testNormalArray() {
        // Test with normal array
		int[] arr = {1, 2, 3, 4, 5};
		assertEquals(9, AdjacentSum.largestAdjacentSum(arr));
	}

	@Test
	public void testNegativeNumbers() {
		// Test with array containing negative numbers
        int[] arr2 = {-1, -2, -3, -4, -5};
        assertEquals(-3, AdjacentSum.largestAdjacentSum(arr2));
	}

	@Test
	public void testLargestSumAtEnd() {
		// Test with array where the largest adjacent sum is at the end
        int[] arr3 = {1, 1, 1, 5, 6};
        assertEquals(11, AdjacentSum.largestAdjacentSum(arr3));
	}

	@Test
	public void testAllSameElements() {
        // Test with array of all same elements
        int[] arr4 = {1, 1, 1, 1};
        assertEquals(2, AdjacentSum.largestAdjacentSum(arr4));
	}

	@Test
	public void testSingleElementArray() {
        // Test with a single element array (should handle gracefully)
        int[] arr5 = {1};
        assertEquals(Integer.MIN_VALUE, AdjacentSum.largestAdjacentSum(arr5)); 
    }
}
