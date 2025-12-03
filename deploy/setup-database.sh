#!/bin/bash

# Database Setup Script for Sugar Sack Counter Backend
# Run this on your DigitalOcean VM

set -e  # Exit on error

echo "========================================="
echo "Setting up PostgreSQL Database"
echo "========================================="

# Create database and user
echo "[1/4] Creating database and user..."
sudo -u postgres psql -c "CREATE DATABASE sugar_sack_counter;" || echo "Database already exists, skipping..."
sudo -u postgres psql -c "CREATE USER sugar_user WITH PASSWORD '${DB_PASSWORD:-sugar_password}';" || echo "User already exists, skipping..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sugar_sack_counter TO sugar_user;"
sudo -u postgres psql -c "ALTER USER sugar_user WITH SUPERUSER;"

# Update PostgreSQL configuration to allow connections
echo "[2/4] Updating PostgreSQL configuration..."
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf

# Update pg_hba.conf to allow password authentication
echo "[3/4] Updating authentication settings..."
sudo tee -a /etc/postgresql/*/main/pg_hba.conf << EOF
# Allow connections from application
host    all             all             0.0.0.0/0               md5
host    all             all             ::/0                    md5
EOF

# Restart PostgreSQL
echo "[4/4] Restarting PostgreSQL..."
sudo systemctl restart postgresql

echo "========================================="
echo "Database setup completed!"
echo "========================================="
echo ""
echo "Database Information:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: sugar_sack_counter"
echo "  User: sugar_user"
echo "  Password: ${DB_PASSWORD:-sugar_password}"
echo ""
echo "Connection string:"
echo "  postgresql://sugar_user:${DB_PASSWORD:-sugar_password}@localhost:5432/sugar_sack_counter"
echo "========================================="
