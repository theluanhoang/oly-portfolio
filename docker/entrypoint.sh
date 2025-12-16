#!/bin/sh
set -e

echo "Starting application entrypoint..."

if [ -d "/app/public/uploads" ]; then
    echo "Ensuring uploads directory permissions..."
    mkdir -p /app/public/uploads || true
fi

if [ "$1" = "node" ] && [ "$2" = "server.js" ]; then
    echo "Running database migrations..."
    
    export DATABASE_URL="${DATABASE_URL}"
    
    echo "Deploying migrations..."
    if npx prisma migrate deploy --config=./prisma.config.ts; then
        echo "Migrations deployed successfully"
    else
        echo "Migration deploy failed, attempting db push as fallback..."
        if npx prisma db push --config=./prisma.config.ts --accept-data-loss; then
            echo "Database schema pushed successfully"
        else
            echo "ERROR: Both migrate deploy and db push failed!"
            echo "Please check database connection and schema"
            exit 1
        fi
    fi
    
    echo "Starting Next.js server..."
fi

exec "$@"


