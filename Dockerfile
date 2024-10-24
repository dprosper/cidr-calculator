FROM rust:latest AS buildwasm
WORKDIR /app
ADD ./frontend-wasm/ ./
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
RUN wasm-pack build --target web

# build client application.
FROM node:lts-alpine
WORKDIR /app
COPY --from=buildwasm /app/pkg /frontend-wasm/pkg
ADD ./webui/ ./
RUN npm install
RUN npm run build
CMD ["npm", "start"]
EXPOSE 3000