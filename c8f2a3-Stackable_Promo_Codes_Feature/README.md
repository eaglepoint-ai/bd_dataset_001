Stackable Promo Codes Feature

Context:
You are a backend engineer at an e-commerce company. The checkout team needs the ability to apply multiple discount codes on a single order. Customers have requested this feature for combining loyalty rewards with promotional offers.

Business Requirement:
Extend the promo code service to support applying multiple codes to a single order with proper conflict handling and discount calculation.

Language and Environment:
- Language: Node.js (JavaScript)
- Database: MongoDB 4.4+
- Existing single-code API must continue working unchanged

Constraints:
- Maximum 3 codes per order
- Total discount cannot exceed 50% of order amount
- Cannot combine two codes of the same restrictive type (percentage, free_shipping)
- If any code fails validation, no codes should be applied (atomic)
- Percentage discounts always apply to ORIGINAL order amount, not remaining
- Flat discounts apply to amount after percentage discounts subtracted
- Free shipping discountValue represents shipping cost and counts toward 50% cap
- Code matching must be case-insensitive (SAVE20 = save20)
- Minimum order checks use original amount, not discounted amount
- Usage limit checks must be atomic to prevent race conditions

Validation Scenarios:
1. Three valid codes of different types applied successfully with correct breakdown
2. Two percentage codes rejected with clear conflict error
3. Two free_shipping codes rejected with clear conflict error
4. Percentage + flat codes apply in correct order (percentage on original first)
5. Total discount capped at 50% when combined discounts exceed limit
6. Invalid code in set causes entire request to fail without applying any
7. Empty code array returns appropriate error
8. Single code works identically to existing API
9. Fourth code rejected with max codes error
10. Return breakdown showing each code's individual contribution
11. $100 order with 20% + $15 flat = $35 discount (percentage on $100, not $80)
12. Minimum order $40 passes for $50 order even after 80% discount
13. "SAVE20" and "save20" treated as duplicate codes
14. Free shipping with $8.99 value counts toward 50% cap
15. Two simultaneous requests for last-use code - exactly one succeeds

