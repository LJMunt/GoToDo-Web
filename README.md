# Todexia Web

Todexia is a modern task management application. This repository contains the web frontend built with React, TypeScript, and Vite.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (latest LTS recommended)
- [pnpm](https://pnpm.io/)

### Installation

```bash
pnpm install
```

### Development

Start the development server:

```bash
pnpm dev
```

### Build

Build the production-ready bundle:

```bash
pnpm build
```

## 🔌 API Documentation

The API documentation for Todexia is available at: [https://docs.todexia.app](https://docs.todexia.app)

To generate TypeScript types from the OpenAPI schema:

```bash
pnpm gen:api
```

## ⚙️ API Configuration

The frontend reads the API base URL in this order:

1. `window.__CONFIG__.API_BASE` (runtime, written by Docker entrypoint)
2. `VITE_API_BASE` (build-time environment variable)
3. `/api` (default)

### Local Development

Use a `.env.local` file with one of the following:

- `VITE_API_PROXY_TARGET=http://localhost:8081` — Proxies `/api/*` through Vite.
- `VITE_API_BASE=http://localhost:8081` — Calls the API directly (requires CORS).

See `.env.example` for defaults.

### Docker Runtime

The Docker entrypoint writes `window.__CONFIG__.API_BASE` using the `API_BASE` environment variable, allowing you to point the frontend at different backends without rebuilding:

```bash
API_BASE=https://api.todexia.app docker run ...
```

## 🛠️ Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Routing:** React Router 7
- **API Client:** OpenAPI TypeScript (Schema-first)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
