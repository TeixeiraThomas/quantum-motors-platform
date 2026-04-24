FROM node:18-bookworm-slim AS builder

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_DISPLAY_REACT_QUERY_DEBUGGER=false

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_DISPLAY_REACT_QUERY_DEBUGGER=$NEXT_PUBLIC_DISPLAY_REACT_QUERY_DEBUGGER

RUN yarn build

FROM node:18-bookworm-slim

WORKDIR /app

# Reuse the dependencies already installed in the builder stage.
COPY --from=builder /app ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4200

EXPOSE 4200

CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "4200"]
