FROM golang:1.21

WORKDIR /app

COPY repository_before/ ./

RUN if [ -f "go.mod" ]; then go mod download; fi

CMD ["echo", "Ready for implementation - create go.mod, main.go and build"]

