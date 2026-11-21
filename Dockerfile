# Imagen para despliegue en Render (DEC-18): un solo servicio con front y API.
FROM oven/bun:1.4.5-slim

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY agent ./agent
COPY src ./src
COPY web ./web
COPY fixtures ./fixtures

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "src/server.ts"]
