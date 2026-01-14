/**
 * Provides functionality to compute the largest sum of adjacent elements in an array.
 */
public class AdjacentSum {

    /**
     * Computes the largest sum of any two adjacent elements in the given array.
     *
     * @param arr An array of integers.
     * @return The largest sum of any two adjacent elements in the array.
     *         Returns Integer.MIN_VALUE if the array has fewer than 2 elements.
     */
    public static int largestAdjacentSum(int arr[]) {
        if (arr.length < 2) {
            return Integer.MIN_VALUE;
        }
        
        int maxSum = Integer.MIN_VALUE;
        for (int i = 1; i < arr.length; i++) {
            int currentSum = arr[i - 1] + arr[i];
            if (currentSum > maxSum) {
                maxSum = currentSum;
            }
        }
        return maxSum;
    }

    public static void main(String args[]) {
        int arr[] = {1, 1, 1, 1, 1, 1, 1, 1};
        System.out.println(largestAdjacentSum(arr));
    }
}
