# Docker Guide

This guide covers using Docker and Docker Compose for development and production.

## Prerequisites

- Docker Desktop (Mac/Windows) or Docker Engine (Linux)
- Docker Compose v2.0+

## Quick Start

### 1. Copy environment file

```bash
cp .env.example .env
```

### 2. Generate JWT secrets

```bash
# Generate strong secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Add to .env file
echo "JWT_SECRET=$JWT_SECRET" >> .env
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET" >> .env
```

### 3. Start services

```bash
# Start all services (postgres, redis, app)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### 4. Access the application

- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **PgAdmin** (optional): http://localhost:5050
  - Email: `admin@example.com`
  - Password: `admin`

## Docker Compose Services

| Service | Description | Port |
|---------|-------------|------|
| `postgres` | PostgreSQL 15 database | 5432 |
| `redis` | Redis cache (optional) | 6379 |
| `app` | Node.js application | 3000 |
| `pgadmin` | PostgreSQL management UI | 5050 (optional) |

## Development Workflow

### Hot Reload Mode

For development with hot reload:

```bash
docker-compose up
```

This uses `npm run dev` with nodemon for automatic restart on file changes.

### Production Mode

For production build:

```bash
docker-compose -f docker-compose.yml --profile production up
```

### Enable PgAdmin

```bash
docker-compose --profile admin up
```

## Common Commands

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 app
```

### Execute commands in container

```bash
# Open shell in app container
docker-compose exec app sh

# Run tests
docker-compose exec app npm test

# Run migrations
docker-compose exec app npm run db:migrate

# Access PostgreSQL directly
docker-compose exec postgres psql -U postgres -d test-auth
```

### Rebuild containers

```bash
# Rebuild app container
docker-compose build app

# Rebuild all containers
docker-compose build

# Force rebuild without cache
docker-compose build --no-cache
```

### Clean up

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes data!)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## Environment Variables

When using Docker Compose, some variables need to be adjusted:

```bash
# .env file for Docker
DB_HOST=postgres          # Not localhost!
REDIS_HOST=redis          # Not localhost!
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Database Management

### Using psql

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d test-auth

# Common commands
\dt                      # List tables
\d users                 # Describe table
SELECT * FROM users;     # Query data
\q                       # Quit
```

### Using PgAdmin

1. Enable PgAdmin: `docker-compose --profile admin up`
2. Open http://localhost:5050
3. Login with admin credentials
4. Add new server:
   - **Host**: `postgres`
   - **Port**: `5432`
   - **Database**: `test-auth`
   - **Username**: `postgres`
   - **Password**: `postgres`

## Troubleshooting

### Port already in use

```bash
# Find process using port
lsof -ti:3000

# Kill process
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

### Database connection issues

```bash
# Check PostgreSQL is healthy
docker-compose ps

# Restart database
docker-compose restart postgres

# View database logs
docker-compose logs postgres
```

### Container keeps restarting

```bash
# Check logs
docker-compose logs app

# Shell into container for debugging
docker-compose exec app sh

# Check health status
docker-compose ps
```

### Volume permissions

```bash
# Fix permission issues on Linux
sudo chown -R $USER:$USER .

# Or rebuild with proper user
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## Production Deployment

### Build production image

```bash
docker build --target production -t node-auth-api:latest .
```

### Run production container

```bash
docker run -d \
  --name node-auth-api \
  -p 3000:3000 \
  --env-file .env \
  -v uploads:/app/uploads \
  node-auth-api:latest
```

### Docker Registry

```bash
# Tag image
docker tag node-auth-api:latest registry.example.com/node-auth-api:1.0.0

# Push to registry
docker push registry.example.com/node-auth-api:1.0.0
```

## Performance Tips

1. **Use volumes** for node_modules to avoid reinstalling dependencies
2. **Enable BuildKit** for faster builds: `DOCKER_BUILDKIT=1 docker-compose build`
3. **Limit resources** in docker-compose.yml for better performance
4. **Use .dockerignore** to exclude unnecessary files from build context

## Security Best Practices

1. **Never commit** `.env` file - use `.env.example` as template
2. **Use secrets** management for production (Docker Swarm, Kubernetes secrets)
3. **Run as non-root** user (already configured in Dockerfile)
4. **Scan images** for vulnerabilities: `docker scan node-auth-api:latest`
5. **Keep images updated** regularly: `docker-compose pull`

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Images](https://hub.docker.com/_/postgres)
- [Redis Docker Images](https://hub.docker.com/_/redis)
