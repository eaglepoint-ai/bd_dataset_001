# Cart Coupon System Feature

## Problem Statement
The CartService needs coupon/promo code functionality. Customers want to apply discount codes at checkout. The system should support percentage and fixed discounts, expiration dates, minimum order requirements, merchant/category restrictions, per-user usage limits, and coupon stacking rules.

## Category
New Feature Development

## Prompt
Add coupon/promo code functionality to the existing CartService.

**Part 1 - Schema Design:**
- Design a `Coupon` model with all required fields
- Design a `UserCouponUsage` model to track per-user usage
- Update the `Cart` model to support applied coupons and discount pricing

**Part 2 - Service Implementation:**
- Implement `validateCoupon(customerId, couponCode)` method
- Implement `applyCoupon(customerId, couponCode)` method
- Implement `removeCoupon(customerId, couponId)` method
- Update existing cart methods to recalculate pricing when items change

## Requirements
1. Design Coupon schema with fields: code (unique), discountType (percentage/fixed), discountValue, minOrderAmount, maxDiscount, merchantId (optional), categoryIds (optional), perUserUsageLimit, validFrom, validUntil, validHoursStart/End (optional), isStackable, isActive
2. Design UserCouponUsage schema with compound unique index on userId + couponId to track usage count per user
3. Update Cart schema to include appliedCoupons array (max 2: one percentage + one fixed) and pricing fields (subtotal, discount, total)
4. Implement validateCoupon that checks: coupon exists/active, date range valid, time-of-day valid (if specified), cart meets minOrderAmount, user hasn't exceeded usage limit, merchant matches (if restricted), cart has matching category items (if restricted)
5. Implement applyCoupon that validates coupon, enforces stacking rules (max 1 percentage + 1 fixed, both must be stackable), calculates discount correctly (percentage first then fixed, cap at maxDiscount, cap at applicable subtotal), and increments usage count atomically
6. Implement removeCoupon that removes specific coupon by ID and recalculates cart pricing
7. Auto-remove invalid coupons when cart changes cause coupon to become invalid (e.g., subtotal drops below minOrderAmount)

## Docker Commands
```bash
# Install dependencies, build, and run
docker-compose run --rm run_before
```

