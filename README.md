# Banking Management System

A full-stack banking management application for working with customers, accounts, charges, loans, payments, transfers, transactions, and reports.

## Technology

- React and Vite
- Node.js and Express
- PostgreSQL
- Docker Compose and Adminer

## Run locally with Docker

### Requirements

- Docker Desktop with Docker Compose
- Node.js 20.19+ or 22.12+ (needed to run the database setup script)

### Start the application

Run these commands from the project root, the folder containing `docker-compose.yml`:

```powershell
docker compose up -d --build
node database/setup_db.js
```

On a new database, the setup script creates the schema and loads the included sample records. Run it once after starting the stack. Do not run it against a database containing data you need to keep; its seed process can replace table contents when it detects an incomplete seed.

### Open the services

| Service | URL |
| --- | --- |
| Client | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Adminer | http://localhost:8080 |

To sign into Adminer, choose **PostgreSQL** and use server `database`, username `postgres`, password `postgres`, and database `banking_db`.

### Stop the application

```powershell
docker compose down
```

The database is stored in a Docker volume, so stopping the containers this way preserves its data.

## Useful Docker commands

```powershell
docker compose ps
docker compose logs -f
docker compose logs -f server
```

## Project layout

```text
client/       React user interface and Nginx configuration
server/       Express API and PostgreSQL data access
database/     PostgreSQL schema and sample data
scripts/      Database start, stop, and status helpers
docker-compose.yml  Full application stack
```

## Configuration and security

Local environment files are ignored by Git. Keep real passwords, database connection strings, and API keys out of the repository. The `.env.example` files are templates; replace their sample values only in local `.env` files.

The included database records are for development and demonstration purposes.
