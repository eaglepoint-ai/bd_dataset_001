FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS server
COPY repository_after/server/package.json ./
RUN bun install
COPY repository_after/server/ .
EXPOSE 5000
CMD ["bun", "run", "dev"]

FROM base AS client
COPY repository_after/client/package.json ./
RUN bun install
COPY repository_after/client/ .
EXPOSE 5173
CMD ["bun", "x", "vite", "--host", "0.0.0.0"]

FROM client AS tests
ENV CI=true
CMD ["bun", "run", "test", "--run"]

FROM tests AS evaluation
ENV RUNNING_IN_DOCKER=true
COPY evaluation/ evaluation/
CMD ["bun", "run", "evaluation/evaluation.js"]
