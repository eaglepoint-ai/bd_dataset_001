FROM golang:1.21
WORKDIR /app
COPY repository_before/ .
RUN go mod tidy
RUN go build -race -o cache_app .
CMD ["./cache_app"]

