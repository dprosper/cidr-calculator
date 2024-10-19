# build server application.
FROM golang:buster as buildgo
WORKDIR /go/src/app
ADD ./frontend-api /go/src/app
ADD ./internal /go/src/app/internal
ADD ./go.mod /go/src/app
RUN go get -d -v ./...
RUN go build -ldflags="-s -w" -o /go/bin/app

# build client application.
FROM node:lts-alpine as buildjs
WORKDIR /app
ADD ./frontend-wasm/ ./frontend-wasm
ADD ./webui/ ./
RUN cd frontend-wasm && wasm-pack build --target web & cd ..
RUN npm ci --silent
RUN npm run build


# Now copy it into our build images.
FROM gcr.io/distroless/base
COPY --from=buildgo /go/bin/app /
COPY --from=buildjs /app/build /public
# ADD ./networks /networks
CMD ["/app"]
EXPOSE 3000