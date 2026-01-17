class DebouncedSearch {
    constructor(callback, delay = 500) {
        this.callback = callback;
        this.delay = delay;
        this.timeout = null;
    }

    search(query) {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => {
            this.callback(query);
        }, this.delay);
    }

    destroy() {
        clearTimeout(this.timeout);
    }
}