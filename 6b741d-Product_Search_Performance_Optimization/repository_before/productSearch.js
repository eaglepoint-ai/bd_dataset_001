class ProductSearch {
  constructor() {
    this.products = [];
  }

  addProduct(product) {
    this.products.push(product);
    return this;
  }

  addProducts(products) {
    for (const product of products) {
      this.products.push(product);
    }
    return this;
  }

  search(query, options = {}) {
    const { category, minPrice, maxPrice, limit = 20 } = options;
    let results = this.products;

    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(product => 
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery)
      );
    }

    if (category) {
      results = results.filter(product => product.category === category);
    }

    if (minPrice !== undefined) {
      results = results.filter(product => product.price >= minPrice);
    }

    if (maxPrice !== undefined) {
      results = results.filter(product => product.price <= maxPrice);
    }

    results = results.sort((a, b) => b.rating - a.rating);

    return results.slice(0, limit);
  }

  searchByCategory(category, limit = 20) {
    let results = this.products.filter(product => product.category === category);
    results = results.sort((a, b) => b.rating - a.rating);
    return results.slice(0, limit);
  }

  getTopRated(limit = 20) {
    const sorted = this.products.sort((a, b) => b.rating - a.rating);
    return sorted.slice(0, limit);
  }

  getProductById(id) {
    return this.products.find(product => product.id === id);
  }

  getCategories() {
    const categories = [];
    for (const product of this.products) {
      if (!categories.includes(product.category)) {
        categories.push(product.category);
      }
    }
    return categories;
  }

  getProductCount() {
    return this.products.length;
  }

  clear() {
    this.products = [];
    return this;
  }
}

module.exports = ProductSearch;

