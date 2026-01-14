const assert = require('assert');
const ProductSearch = require('../repository_before/productSearch');

describe('ProductSearch (BEFORE) - Baseline/Unoptimized', function() {
    this.timeout(5000);
    let products;
    let search;
    beforeEach(() => {
        products = [];
        for (let i = 0; i < 100000; i++) {
            products.push({
                id: `id${i}`,
                name: `Product ${i} Special` + (i % 2 === 0 ? ' Alpha' : ' Beta'),
                description: `Description for product ${i} with keyword${i % 100}`,
                category: `Category${i % 10}`,
                price: (i % 1000) + 0.99,
                rating: (i % 5) + (i % 100) / 100,
            });
        }
        search = new ProductSearch();
        search.addProducts(products);
    });

    it('should return correct count and categories', () => {
        assert.strictEqual(search.getProductCount(), 100000);
        const cats = search.getCategories();
        assert.strictEqual(cats.length, 10);
        for (let i = 0; i < 10; i++) {
            assert(cats.includes(`Category${i}`));
        }
    });

    it('should find product by id', () => {
        assert.deepStrictEqual(search.getProductById('id12345').id, 'id12345');
        assert.strictEqual(search.getProductById('notfound'), undefined);
    });

    it('should filter by category and limit', () => {
        const results = search.searchByCategory('Category3', 15);
        assert(results.length <= 15);
        results.forEach(p => assert.strictEqual(p.category, 'Category3'));
    });

    it('should filter by price range', () => {
        const results = search.search('', { minPrice: 500, maxPrice: 505 });
        results.forEach(p => assert(p.price >= 500 && p.price <= 505));
    });

    it('should filter by query (name/desc, case-insensitive)', () => {
        const results = search.search('special alpha', { limit: 50 });
        assert(results.length > 0);
        results.forEach(p => {
            assert(
                p.name.toLowerCase().includes('special alpha') ||
                p.description.toLowerCase().includes('special alpha')
            );
        });
    });

    it('should return top rated products', () => {
        const top = search.getTopRated(10);
        assert(top.length <= 10);
        for (let i = 1; i < top.length; i++) {
            assert(top[i - 1].rating >= top[i].rating);
        }
    });

    it('should clear all products', () => {
        search.clear();
        assert.strictEqual(search.getProductCount(), 0);
        assert.deepStrictEqual(search.getCategories(), []);
    });

    it('should perform search of 100,000 products in under 100ms (expected to FAIL)', () => {
        const t0 = Date.now();
        const results = search.search('keyword42', { limit: 20 });
        const t1 = Date.now();
        assert(t1 - t0 < 100, `Search took ${t1 - t0}ms (expected to FAIL)`);
        assert(results.length <= 20);
    });
});
