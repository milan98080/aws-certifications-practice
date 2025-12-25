#!/bin/bash

echo "PostgreSQL is ready. Running data migration..."

# Set environment variables
export DATABASE_URL="postgresql://postgres:password@localhost:5432/aws_practice"

# Run the migration script
cd /docker-entrypoint-initdb.d
node ../migrate.js

echo "Data migration completed!"