# GoToDo Web

GoToDo is a modern, privacy-focused task management application. This repository contains the web frontend built with **React 19**, **TypeScript**, and **Vite**.

## ✨ Features

- **Blazing Fast UI:** Built with React 19 and Tailwind CSS for a smooth, responsive experience.
- **Type Safety:** Full TypeScript support with schema-first API client generated from OpenAPI.
- **Modern Styling:** Clean, accessible UI with dark mode support.
- **Flexible Deployment:** Easily configurable for local development or Docker-based production environments.
- **Admin Dashboard:** Integrated tools for user management and system health monitoring.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (latest LTS recommended)
- [pnpm](https://pnpm.io/)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/ljmunt/gotodo-web.git
cd gotodo-web
pnpm install
```

### Development

Start the development server with Hot Module Replacement (HMR):

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`.

### Build

Create a production-ready bundle in the `dist/` directory:

```bash
pnpm build
```

## ⚙️ Configuration

### Frontend Configuration

The frontend determines the API base URL at runtime in the following order:

1.  `window.__CONFIG__.API_BASE` (set at runtime by Docker entrypoint via `API_BASE` env var)
2.  `VITE_API_BASE` (defined at build-time in `.env` files)
3.  `/api` (default fallback)

#### Local Development Environment

Create a `.env.local` file to configure your local development environment:

```bash
# Option A: Proxy through Vite (recommended for local dev)
VITE_API_PROXY_TARGET=http://localhost:8081

# Option B: Direct API calls (requires CORS configuration on backend)
VITE_API_BASE=http://localhost:8081
```

### 🔌 API Documentation & Types

The API follows the OpenAPI specification. The schema is located at `api/openapi.yml`.

To regenerate TypeScript types from the schema:

```bash
pnpm gen:api
```

## 🐳 Docker Deployment

### Docker Compose (Full Stack)

To run the complete GoToDo stack (Frontend, Backend, and Database) locally:

1. Use the provided `docker-compose.yml` file:

```yaml
services:
  gotodo-web:
    build:
      context: .
      dockerfile: Dockerfile
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
      # Required runtime settings
      - DATABASE_URL=postgres://gotodo:gotodo@db:5432/gotodo?sslmode=disable
      - PORT=8081
      - JWT_SECRET=your_jwt_secret_here
      - JWT_ISSUER=gotodo
      - JWT_AUDIENCE=gotodo-client
      - SECRETS_MASTER_KEY_B64=base64-encoded-32-byte-key
      
      # Optional server hardening (Go time.Duration format, e.g. 10s, 1m)
      # - HTTP_READ_HEADER_TIMEOUT=5s
      # - HTTP_READ_TIMEOUT=20s
      # - HTTP_WRITE_TIMEOUT=20s
      # - HTTP_IDLE_TIMEOUT=60s
      # - HTTP_SHUTDOWN_TIMEOUT=10s
      
      # Trusted proxy IPs/CIDRs for real client IP (comma-separated)
      # - TRUSTED_PROXIES=10.0.0.0/8,192.168.0.0/16
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

2. Launch the stack:

```bash
docker compose up -d
```

The web interface will be accessible at `http://localhost:8080`.

### Docker Environment Variables

#### Web Frontend (`gotodo-web`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `API_HOST` | Hostname of the GoToDo backend | `gotodo` |
| `API_PORT` | Port of the GoToDo backend | `8081` |
| `API_BASE` | Base path for API requests | `/api` |

#### Backend (`gotodo`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://gotodo:gotodo@db:5432/gotodo?sslmode=disable` |
| `PORT` | Backend listening port | `8081` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your_jwt_secret_here` |
| `JWT_ISSUER` | JWT Issuer claim | `gotodo` |
| `JWT_AUDIENCE` | JWT Audience claim | `gotodo-client` |
| `SECRETS_MASTER_KEY_B64` | Base64-encoded 32-byte key for encryption | `base64-encoded-32-byte-key` |

## 🛠️ Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Routing:** React Router 7
- **Language:** TypeScript
- **API Client:** OpenAPI TypeScript (Schema-first)
- **Containerization:** Docker & Docker Compose

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
