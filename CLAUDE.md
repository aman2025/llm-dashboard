# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A simple Elysia.js API server running on Bun runtime. The server exposes CORS-enabled endpoints and reads configuration from environment variables.

## Commands

```bash
bun run dev      # Start development server with watch mode, loads .env.development
bun run start    # Start production server, loads .env.production
bun test         # No tests configured (exits with error)
```

## Architecture

Single-entry point at [src/index.ts](src/index.ts). The Elysia app is composed by:
- `cors` plugin from `@elysiajs/cors` for cross-origin support
- Routes: `GET /` and `GET /api/todo`
- Listens on `PORT` env var (default 3002)

## Environment Configuration

Three env files exist for different stages:
- `.env` - base defaults
- `.env.development` - development (PORT=3002, DATABASE_URL=mongodb://localhost:27017/dev)
- `.env.production` - production (PORT=3002, DATABASE_URL=mongodb://atlas/prod, AI_KEY set)

The server logs all env vars at startup (NODE_ENV, PORT, DATABASE_URL, AI_KEY).