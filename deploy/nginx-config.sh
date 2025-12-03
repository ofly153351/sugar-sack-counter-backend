#!/bin/bash

# Nginx Configuration Script for Sugar Sack Counter Backend
# Run this on your DigitalOcean VM

set -e  # Exit on error

echo "========================================="
echo "Setting up Nginx Reverse Proxy"
echo "========================================="

# Variables
DOMAIN="${1:-your-domain.com}"  # Pass domain as first argument or use default
APP_PORT=3000
APP_DIR="/var/www/sugar-sack-backend"

echo "[1/5] Creating Nginx configuration..."

# Create Nginx site configuration
sudo tee /etc/nginx/sites-available/sugar-sack-backend << EOF
# Sugar Sack Counter Backend - N