# Cart Service Unit Tests

## Problem Statement
The CartService is a Node.js/Mongoose service handling shopping cart operations for a food delivery application. The service includes methods for cart retrieval, item management, and checkout. Write comprehensive unit tests using Jest to validate all service methods and achieve at least 80% code coverage.

## Prompt
Write unit tests for the CartService using Jest. The tests should mock Mongoose models (Cart, MenuItem, Merchant) and external dependencies. Cover all public methods: getCart, addToCart, updateCartItem, removeFromCart, clearCart, deleteCart, and checkoutCart.

## Requirements
1. Mock all Mongoose models (Cart, MenuItem, Merchant) and their chained methods (findOne, populate, lean, save, etc.)
2. Test getCart returns empty cart structure when no cart exists and properly formats cart with items
3. Test addToCart validates menu item existence, availability, handles duplicates, calculates subtotals with addOns
4. Test updateCartItem handles cart/item not found, removes item when quantity is 0, recalculates subtotals
5. Test removeFromCart and clearCart handle cart not found and properly modify cart state
6. Test deleteCart calls findOneAndDelete with correct parameters
7. Test checkoutCart validates selections, handles empty cart, prevents multi-merchant orders, creates order and removes items
8. Achieve at least 80% code coverage for statements, branches, functions, and lines

## Category
Testing

## Commands
```bash
docker-compose run --rm run_before
```

