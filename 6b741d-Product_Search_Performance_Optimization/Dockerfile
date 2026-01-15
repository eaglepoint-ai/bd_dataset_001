FROM node:20-slim

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies and mocha globally for test automation
RUN npm install --production=false 2>/dev/null || true \
	&& npm install -g mocha



# Copy everything (including tests/)
COPY . /app


# Diagnostic: print directory structure at build time
RUN echo '--- /app contents at build ---' && ls -l /app && echo '--- /app/tests contents at build ---' && ls -l /app/tests || echo 'No /app/tests directory'

# Default command: print structure and run tests
CMD ["sh", "-c", "echo '--- /app at runtime ---' && ls -l /app && echo '--- /app/tests at runtime ---' && ls -l /app/tests || echo 'No /app/tests directory' && exec $@", "npx", "mocha", "tests/productSearch.before.test.js"]

