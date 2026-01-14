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

    @Test
    public void testEmptyArray() {
        // Test with an empty array
        int[] arr = {};
        assertEquals(Integer.MIN_VALUE, AdjacentSum.largestAdjacentSum(arr));
    }

    @Test
    public void testTwoElementArray() {
        // Test with an array of exactly two elements
        int[] arr = {4, 7};
        assertEquals(11, AdjacentSum.largestAdjacentSum(arr));
    }

    @Test
    public void testMixedPositiveAndNegative() {
        // Test with an array of mixed positive and negative numbers
        int[] arr = {-10, 5, -2, 8, -1};
        assertEquals(7, AdjacentSum.largestAdjacentSum(arr));
    }

    @Test
    public void testArrayWithZeros() {
        // Test with an array containing zeros
        int[] arr = {0, -1, 0, 5, 0};
        assertEquals(5, AdjacentSum.largestAdjacentSum(arr));
    }

    // Position sensitivity
    @Test
    public void testMaxAdjacentSumAtBeginning() {

        int[] arr = {10, 9, -5, -6};
        assertEquals(19, AdjacentSum.largestAdjacentSum(arr));
    }

    @Test
    public void testMaxAdjacentSumInMiddle() {
        int[] arr = {-5, 4, 6, -10};
        assertEquals(10, AdjacentSum.largestAdjacentSum(arr));
    }

    @Test
    public void testIntegerMaxValue() {
        // Test with Integer.MAX_VALUE
        int[] arr = {Integer.MAX_VALUE, 0};
        assertEquals(Integer.MAX_VALUE, AdjacentSum.largestAdjacentSum(arr));
    }

    @Test
    public void testIntegerMinValue() {
        // Test with Integer.MIN_VALUE
        int[] arr = {Integer.MIN_VALUE, 0};
        assertEquals(Integer.MIN_VALUE, AdjacentSum.largestAdjacentSum(arr));
    }

    @Test
    public void testIntegerOverflow() {
        // This will cause overflow in Java int
        int[] arr = {Integer.MAX_VALUE, 1};
        int expected = Integer.MIN_VALUE; // wraps in Java int
        assertEquals(expected, AdjacentSum.largestAdjacentSum(arr));
    }

    @Test
    public void testIntegerUnderflow() {
        // This will cause underflow in Java int
        int[] arr = {Integer.MIN_VALUE, -1};
        int expected = Integer.MAX_VALUE; // wraps in Java int
        assertEquals(expected, AdjacentSum.largestAdjacentSum(arr));
    }
}
