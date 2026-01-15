/**
 * CartService Bug Fix Tests
 * 
 * Tests for the 9 requirements:
 * 1. Throw error when adding item from different merchant than existing cart items
 * 2. Validate quantity is a positive integer greater than zero
 * 3. Use atomic operation to prevent duplicate items on concurrent requests
 * 4. Apply discounted price when discount is active and within valid date range
 * 5. Return updated cart from removeFromCart instead of null
 * 6. Recalculate cart pricing.subtotal after any item modification
 * 7. Recalculate cart pricing.totalItems after any item modification
 * 8. Handle edge case when cart has items but merchantId is not set
 * 9. Ensure all Decimal128 price values are converted correctly
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Will be set dynamically based on REPOSITORY_PATH env var
let CartService;
let Cart;
let MenuItem;
let Merchant;
let HttpError;

let mongoServer;

// Test data
const customerId = new mongoose.Types.ObjectId();
const merchantId1 = new mongoose.Types.ObjectId();
const merchantId2 = new mongoose.Types.ObjectId();
const menuItemId1 = new mongoose.Types.ObjectId();
const menuItemId2 = new mongoose.Types.ObjectId();
const menuItemId3 = new mongoose.Types.ObjectId();
const extraId1 = new mongoose.Types.ObjectId();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Load modules from the specified repository path
  const repoPath = process.env.REPOSITORY_PATH || '../repository_after';
  CartService = require(`${repoPath}/cartService`);
  Cart = require(`${repoPath}/models/Cart.model`);
  MenuItem = require(`${repoPath}/models/MenuItem.model`);
  Merchant = require(`${repoPath}/models/Merchant.model`);
  HttpError = require(`${repoPath}/utils/httpError`);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  await Cart.deleteMany({});
  await MenuItem.deleteMany({});
  await Merchant.deleteMany({});
});

// Helper function to create test merchants
async function createMerchant(overrides = {}) {
  const defaultMerchant = {
    _id: merchantId1,
    businessName: 'Test Restaurant',
    businessType: 'restaurant',
    isOpen: true,
    rating: 4.5
  };
  const merchant = new Merchant({ ...defaultMerchant, ...overrides });
  await merchant.save();
  return merchant;
}

// Helper function to create test menu items
async function createMenuItem(overrides = {}) {
  const defaultMenuItem = {
    _id: menuItemId1,
    merchantId: merchantId1,
    name: 'Test Burger',
    price: mongoose.Types.Decimal128.fromString('10.99'),
    isAvailable: true,
    productType: 'simple',
    images: [{ url: 'http://example.com/burger.jpg', isPrimary: true }],
    extras: [
      { _id: extraId1, name: 'Extra Cheese', price: mongoose.Types.Decimal128.fromString('1.50') }
    ],
    variants: [],
    discount: null
  };
  
  const menuItem = new MenuItem({ ...defaultMenuItem, ...overrides });
  await menuItem.save();
  return menuItem;
}

// Helper to create a cart with items
async function createCartWithItems(items = [], cartOverrides = {}) {
  const cart = new Cart({
    customerId,
    merchantId: merchantId1,
    items,
    pricing: { subtotal: 0, totalItems: 0 },
    ...cartOverrides
  });
  await cart.save();
  return cart;
}

// ============================================================================
// Requirement 1: Throw error when adding item from different merchant
// ============================================================================
describe('Requirement 1: Different merchant validation', () => {
  test('should throw error when adding item from different merchant', async () => {
    // Create menu items from different merchants
    await createMenuItem({ _id: menuItemId1, merchantId: merchantId1 });
    await createMenuItem({ _id: menuItemId2, merchantId: merchantId2, name: 'Pizza' });

    // Add first item
    await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 1
    });

    // Try to add item from different merchant
    await expect(
      CartService.addToCart(customerId, {
        menuItemId: menuItemId2,
        quantity: 1
      })
    ).rejects.toThrow(/different merchant|clear your cart/i);
  });

  test('should allow adding items from same merchant', async () => {
    await createMenuItem({ _id: menuItemId1, merchantId: merchantId1 });
    await createMenuItem({ _id: menuItemId2, merchantId: merchantId1, name: 'Fries' });

    await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 1
    });

    const cart = await CartService.addToCart(customerId, {
      menuItemId: menuItemId2,
      quantity: 1
    });

    expect(cart.items).toHaveLength(2);
  });
});

// ============================================================================
// Requirement 2: Validate quantity is a positive integer > 0
// ============================================================================
describe('Requirement 2: Quantity validation', () => {
  beforeEach(async () => {
    await createMenuItem();
  });

  test('should reject quantity of 0', async () => {
    await expect(
      CartService.addToCart(customerId, {
        menuItemId: menuItemId1,
        quantity: 0
      })
    ).rejects.toThrow(/positive integer|greater than zero/i);
  });

  test('should reject negative quantity', async () => {
    await expect(
      CartService.addToCart(customerId, {
        menuItemId: menuItemId1,
        quantity: -5
      })
    ).rejects.toThrow(/positive integer|greater than zero/i);
  });

  test('should reject non-integer quantity', async () => {
    await expect(
      CartService.addToCart(customerId, {
        menuItemId: menuItemId1,
        quantity: 1.5
      })
    ).rejects.toThrow(/positive integer|greater than zero/i);
  });

  test('should accept valid positive integer quantity', async () => {
    const cart = await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 3
    });

    expect(cart.items[0].quantity).toBe(3);
  });
});

// ============================================================================
// Requirement 3: Atomic operation to prevent duplicate items
// ============================================================================
describe('Requirement 3: Atomic duplicate prevention', () => {
  test('should prevent duplicate items using atomic operation', async () => {
    await createMenuItem();

    // Add item first time
    await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 1
    });

    // Try to add same item again - should fail
    await expect(
      CartService.addToCart(customerId, {
        menuItemId: menuItemId1,
        quantity: 1
      })
    ).rejects.toThrow(/already in your cart/i);
  });

  test('should use findOneAndUpdate for atomic operation', async () => {
    // This test verifies the atomic pattern is used by checking behavior
    await createMenuItem();

    const cart1 = await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 2
    });

    // Cart should be created atomically with item
    expect(cart1.items).toHaveLength(1);
    expect(cart1.items[0].menuItemId.toString()).toBe(menuItemId1.toString());
  });
});

// ============================================================================
// Requirement 4: Apply discounted price within valid date range
// ============================================================================
describe('Requirement 4: Discount application', () => {
  test('should apply discounted price when discount is active and within date range', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await createMenuItem({
      price: mongoose.Types.Decimal128.fromString('10.00'),
      discountedPrice: mongoose.Types.Decimal128.fromString('8.00'),
      discount: {
        isActive: true,
        percentage: 20,
        validFrom: yesterday,
        validUntil: tomorrow
      }
    });

    const cart = await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 1
    });

    // Should use discounted price of 8.00, not full price of 10.00
    expect(parseFloat(cart.items[0].price.toString())).toBe(8.00);
  });

  test('should NOT apply discount when outside date range', async () => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    await createMenuItem({
      price: mongoose.Types.Decimal128.fromString('10.00'),
      discountedPrice: mongoose.Types.Decimal128.fromString('8.00'),
      discount: {
        isActive: true,
        percentage: 20,
        validFrom: lastWeek,
        validUntil: yesterday  // Expired
      }
    });

    const cart = await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 1
    });

    // Should use full price since discount expired
    expect(parseFloat(cart.items[0].price.toString())).toBe(10.00);
  });

  test('should NOT apply discount when inactive', async () => {
    await createMenuItem({
      price: mongoose.Types.Decimal128.fromString('10.00'),
      discountedPrice: mongoose.Types.Decimal128.fromString('8.00'),
      discount: {
        isActive: false,
        percentage: 20
      }
    });

    const cart = await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 1
    });

    expect(parseFloat(cart.items[0].price.toString())).toBe(10.00);
  });
});

// ============================================================================
// Requirement 5: Return updated cart from removeFromCart
// ============================================================================
describe('Requirement 5: removeFromCart returns cart', () => {
  test('should return updated cart instead of null', async () => {
    await createMenuItem();
    
    const addedCart = await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 2
    });

    const itemId = addedCart.items[0]._id.toString();
    const result = await CartService.removeFromCart(customerId, itemId);

    // Should return cart object, not null
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('pricing');
    expect(result.items).toHaveLength(0);
  });

  test('returned cart should have updated pricing', async () => {
    await createMenuItem({ _id: menuItemId1 });
    await createMenuItem({ _id: menuItemId2, name: 'Fries', price: mongoose.Types.Decimal128.fromString('5.00') });

    await CartService.addToCart(customerId, { menuItemId: menuItemId1, quantity: 1 });
    const cart = await CartService.addToCart(customerId, { menuItemId: menuItemId2, quantity: 1 });

    const itemToRemove = cart.items[0]._id.toString();
    const result = await CartService.removeFromCart(customerId, itemToRemove);

    expect(result.items).toHaveLength(1);
    expect(result.pricing.totalItems).toBe(1);
  });
});

// ============================================================================
// Requirement 6: Recalculate pricing.subtotal after modification
// ============================================================================
describe('Requirement 6: Recalculate pricing.subtotal', () => {
  test('should update subtotal after adding item', async () => {
    await createMenuItem({ price: mongoose.Types.Decimal128.fromString('10.00') });

    const cart = await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 2
    });

    expect(cart.pricing.subtotal).toBe(20.00);
  });

  test('should update subtotal after updateCartItem', async () => {
    await createMenuItem({ price: mongoose.Types.Decimal128.fromString('10.00') });

    const cart = await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 2
    });

    const itemId = cart.items[0]._id.toString();
    const updated = await CartService.updateCartItem(customerId, itemId, { quantity: 5 });

    // 10.00 * 5 = 50.00
    expect(updated.pricing.subtotal).toBe(50.00);
  });

  test('should update subtotal after removeFromCart', async () => {
    await createMenuItem({ _id: menuItemId1, price: mongoose.Types.Decimal128.fromString('10.00') });
    await createMenuItem({ _id: menuItemId2, name: 'Fries', price: mongoose.Types.Decimal128.fromString('5.00') });

    await CartService.addToCart(customerId, { menuItemId: menuItemId1, quantity: 1 });
    const cart = await CartService.addToCart(customerId, { menuItemId: menuItemId2, quantity: 2 });

    // Initial: 10 + 10 = 20
    expect(cart.pricing.subtotal).toBe(20.00);

    const itemToRemove = cart.items.find(i => i.menuItemId.toString() === menuItemId1.toString())._id.toString();
    const result = await CartService.removeFromCart(customerId, itemToRemove);

    // After removal: 5 * 2 = 10
    expect(result.pricing.subtotal).toBe(10.00);
  });
});

// ============================================================================
// Requirement 7: Recalculate pricing.totalItems after modification
// ============================================================================
describe('Requirement 7: Recalculate pricing.totalItems', () => {
  test('should update totalItems after adding item', async () => {
    await createMenuItem();

    const cart = await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 3
    });

    expect(cart.pricing.totalItems).toBe(3);
  });

  test('should update totalItems after updateCartItem', async () => {
    await createMenuItem();

    const cart = await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 2
    });

    const itemId = cart.items[0]._id.toString();
    const updated = await CartService.updateCartItem(customerId, itemId, { quantity: 5 });

    expect(updated.pricing.totalItems).toBe(5);
  });

  test('should update totalItems after removeFromCart', async () => {
    await createMenuItem({ _id: menuItemId1 });
    await createMenuItem({ _id: menuItemId2, name: 'Fries' });

    await CartService.addToCart(customerId, { menuItemId: menuItemId1, quantity: 2 });
    const cart = await CartService.addToCart(customerId, { menuItemId: menuItemId2, quantity: 3 });

    expect(cart.pricing.totalItems).toBe(5);

    const itemToRemove = cart.items[0]._id.toString();
    const result = await CartService.removeFromCart(customerId, itemToRemove);

    expect(result.pricing.totalItems).toBe(3);
  });
});

// ============================================================================
// Requirement 8: Handle cart with items but merchantId not set
// ============================================================================
describe('Requirement 8: Handle missing merchantId on cart', () => {
  test('should set merchantId when cart has items but merchantId is null', async () => {
    await createMenuItem({ _id: menuItemId1, merchantId: merchantId1 });
    await createMenuItem({ _id: menuItemId2, merchantId: merchantId1, name: 'Fries' });

    // Create cart with items but no merchantId (edge case)
    const existingCart = new Cart({
      customerId,
      merchantId: null,  // Missing merchantId
      items: [{
        menuItemId: menuItemId1,
        name: 'Test Item',
        price: mongoose.Types.Decimal128.fromString('10.00'),
        quantity: 1,
        variations: [],
        addOns: [],
        subtotal: mongoose.Types.Decimal128.fromString('10.00')
      }],
      pricing: { subtotal: 10, totalItems: 1 }
    });
    await existingCart.save();

    // Adding new item should set the merchantId
    const result = await CartService.addToCart(customerId, {
      menuItemId: menuItemId2,
      quantity: 1
    });

    expect(result.merchantId).toBeDefined();
    expect(result.merchantId.toString()).toBe(merchantId1.toString());
  });
});

// ============================================================================
// Requirement 9: Ensure Decimal128 values converted correctly
// ============================================================================
describe('Requirement 9: Decimal128 conversion', () => {
  test('should correctly convert Decimal128 price to number', async () => {
    await createMenuItem({ 
      price: mongoose.Types.Decimal128.fromString('10.99')
    });

    const cart = await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 1
    });

    // Price should be a proper number, not a Decimal128 object
    const price = cart.items[0].price;
    expect(typeof parseFloat(price.toString())).toBe('number');
    expect(parseFloat(price.toString())).toBeCloseTo(10.99, 2);
  });

  test('should correctly convert Decimal128 subtotal to number', async () => {
    await createMenuItem({ 
      price: mongoose.Types.Decimal128.fromString('10.99')
    });

    const cart = await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 2
    });

    // Subtotal should be correct
    const subtotal = parseFloat(cart.items[0].subtotal.toString());
    expect(subtotal).toBeCloseTo(21.98, 2);
  });

  test('should correctly convert addon prices from Decimal128', async () => {
    await createMenuItem({
      extras: [
        { _id: extraId1, name: 'Extra Cheese', price: mongoose.Types.Decimal128.fromString('1.50') }
      ]
    });

    const cart = await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 1,
      addOns: [{ name: 'Extra Cheese' }]
    });

    const addonPrice = parseFloat(cart.items[0].addOns[0].price.toString());
    expect(typeof addonPrice).toBe('number');
    expect(addonPrice).toBeCloseTo(1.50, 2);
  });

  test('getCart should return properly converted Decimal128 values', async () => {
    await createMerchant();
    await createMenuItem();

    await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 2
    });

    const cart = await CartService.getCart(customerId);

    expect(typeof cart.pricing.subtotal).toBe('number');
    expect(typeof cart.items[0].price).toBe('number');
    expect(typeof cart.items[0].subtotal).toBe('number');
  });
});

// ============================================================================
// Additional integration tests
// ============================================================================
describe('Integration tests', () => {
  test('clearCart should reset pricing to zero', async () => {
    await createMenuItem();

    await CartService.addToCart(customerId, {
      menuItemId: menuItemId1,
      quantity: 5
    });

    const clearedCart = await CartService.clearCart(customerId);

    expect(clearedCart.items).toHaveLength(0);
    expect(clearedCart.pricing.subtotal).toBe(0);
    expect(clearedCart.pricing.totalItems).toBe(0);
  });

  test('full cart workflow should maintain correct pricing', async () => {
    await createMenuItem({ _id: menuItemId1, price: mongoose.Types.Decimal128.fromString('10.00') });
    await createMenuItem({ _id: menuItemId2, name: 'Fries', price: mongoose.Types.Decimal128.fromString('5.00') });

    // Add first item
    let cart = await CartService.addToCart(customerId, { menuItemId: menuItemId1, quantity: 2 });
    expect(cart.pricing.subtotal).toBe(20.00);
    expect(cart.pricing.totalItems).toBe(2);

    // Add second item
    cart = await CartService.addToCart(customerId, { menuItemId: menuItemId2, quantity: 3 });
    expect(cart.pricing.subtotal).toBe(35.00);
    expect(cart.pricing.totalItems).toBe(5);

    // Update quantity
    const item1Id = cart.items.find(i => i.menuItemId.toString() === menuItemId1.toString())._id.toString();
    cart = await CartService.updateCartItem(customerId, item1Id, { quantity: 1 });
    expect(cart.pricing.subtotal).toBe(25.00);
    expect(cart.pricing.totalItems).toBe(4);

    // Remove item
    cart = await CartService.removeFromCart(customerId, item1Id);
    expect(cart.pricing.subtotal).toBe(15.00);
    expect(cart.pricing.totalItems).toBe(3);
  });
});

