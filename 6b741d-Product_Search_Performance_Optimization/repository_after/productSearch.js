class MinHeap {
    constructor(maxSize) {
        this.heap = [];
        this.maxSize = maxSize;
    }

    push(product) {
        if (this.heap.length < this.maxSize) {
            this.heap.push(product);
            this._siftUp(this.heap.length - 1);
        } else if (this._compare(product, this.heap[0]) > 0) {
            this.heap[0] = product;
            this._siftDown(0);
        }
    }

    getSorted() {
        return this.heap.sort((a, b) => {
            if (b.rating === a.rating) {
                return a.id < b.id ? -1 : 1;
            }
            return b.rating - a.rating;
        });
    }

    _compare(a, b) {
        if (a.rating !== b.rating) {
            return a.rating - b.rating;
        }
        // Tie-breaker: Preserve items with "better" (smaller) ID if ratings are equal.
        // We want to evict the "worst" item.
        return b.id.localeCompare(a.id);
    }

    _siftUp(index) {
        let parent = Math.floor((index - 1) / 2);
        while (index > 0 && this._compare(this.heap[index], this.heap[parent]) < 0) {
            [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
            index = parent;
            parent = Math.floor((index - 1) / 2);
        }
    }

    _siftDown(index) {
        let minIndex = index;
        const left = 2 * index + 1;
        const right = 2 * index + 2;

        if (left < this.heap.length && this._compare(this.heap[left], this.heap[minIndex]) < 0) {
            minIndex = left;
        }
        if (right < this.heap.length && this._compare(this.heap[right], this.heap[minIndex]) < 0) {
            minIndex = right;
        }

        if (index !== minIndex) {
            [this.heap[index], this.heap[minIndex]] = [this.heap[minIndex], this.heap[index]];
            this._siftDown(minIndex);
        }
    }
}

class ProductSearch {
    constructor() {
        this.products = [];
        this.categoryMap = new Map();
        this.idMap = new Map();
    }

    addProduct(product) {
        product._nameLower = product.name.toLowerCase();
        product._descLower = product.description.toLowerCase();

        this.products.push(product);
        // Only set idMap if this is the first occurrence of the ID (strict equivalence)
        if (!this.idMap.has(product.id)) {
            this.idMap.set(product.id, product);
        }

        if (!this.categoryMap.has(product.category)) {
            this.categoryMap.set(product.category, []);
        }
        this.categoryMap.get(product.category).push(product);

        return this;
    }

    addProducts(products) {
        for (const product of products) {
            this.addProduct(product);
        }
        return this;
    }

    search(query, options = {}) {
        const { category, minPrice, maxPrice, limit = 20 } = options;
        const heap = new MinHeap(limit);

        let candidates = this.products;
        if (category) {
            candidates = this.categoryMap.get(category);
            if (!candidates) return [];
        }

        const lowerQuery = query ? query.toLowerCase() : null;

        for (const product of candidates) {
            if (minPrice !== undefined && product.price < minPrice) continue;
            if (maxPrice !== undefined && product.price > maxPrice) continue;

            if (lowerQuery) {
                if (!product._nameLower.includes(lowerQuery) &&
                    !product._descLower.includes(lowerQuery)) {
                    continue;
                }
            }

            heap.push(product);
        }

        return heap.getSorted();
    }

    searchByCategory(category, limit = 20) {
        const products = this.categoryMap.get(category);
        if (!products) return [];

        const heap = new MinHeap(limit);
        for (const product of products) {
            heap.push(product);
        }
        return heap.getSorted();
    }

    getTopRated(limit = 20) {
        const heap = new MinHeap(limit);
        for (const product of this.products) {
            heap.push(product);
        }
        return heap.getSorted();
    }

    getProductById(id) {
        return this.idMap.get(id);
    }

    getCategories() {
        return Array.from(this.categoryMap.keys());
    }

    getProductCount() {
        return this.products.length;
    }

    clear() {
        this.products = [];
        this.categoryMap.clear();
        this.idMap.clear();
        return this;
    }
}

module.exports = ProductSearch;
