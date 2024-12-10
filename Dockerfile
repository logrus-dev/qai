FROM node:23-bookworm AS build
WORKDIR /build
COPY ./package.json .
COPY ./package-lock.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:23-alpine3.20
WORKDIR /app
COPY --from=build /build/dist ./dist
COPY --from=build /build/node_modules ./node_modules
COPY ./src/templates ./templates
COPY ./src/static ./static

ENV TEMPLATES=/app/templates
ENV STATIC_CONTENT=/app/static

EXPOSE 8080
CMD ["node", "dist/index.js"]
