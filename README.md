# GoToDo Web

GoToDo is a modern task management application. This repository contains the web frontend built with React, TypeScript, and Vite.

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

### Docker Compose

To run the complete GoToDo stack (Frontend, Backend, and Database) using pre-built images:

1. Create a `docker-compose.yaml` file with the following content:

```yaml
services:
  gotodo-web:
    image: ghcr.io/ljmunt/gotodo-web:latest
    ports:
      - "8080:80"
    environment:
      - API_HOST=gotodo
      - API_PORT=8081
      - API_BASE=/api
    depends_on:
      - gotodo
    restart: unless-stopped

  gotodo:
    image: ghcr.io/ljmunt/gotodo:latest
    environment:
      - DATABASE_URL=postgres://gotodo:gotodo@db:5432/gotodo
      - PORT=8081
      - JWT_SECRET=your_secret_here
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: gotodo
      POSTGRES_USER: gotodo
      POSTGRES_PASSWORD: gotodo
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gotodo"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  db-data:
```

2. Run the application:

```bash
docker compose up -d
```

### Connecting to a local backend
If your backend is running on your host machine (not in Docker), the container needs to know how to reach it. 

1.  **Use `host.docker.internal`**: In `docker-compose.yml`, the `API_HOST` is set to `host.docker.internal`.
2.  **Linux Users**: The `extra_hosts` mapping `host.docker.internal:host-gateway` is already included in `docker-compose.yml` to make this work on Linux.
3.  **Ensure your API listens on all interfaces**: If your backend is bound only to `127.0.0.1`, the Docker container won't be able to reach it even with the correct hostname. Make sure it listens on `0.0.0.0`.

## 🛠️ Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Routing:** React Router 7
- **API Client:** OpenAPI TypeScript (Schema-first)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
