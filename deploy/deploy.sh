#!/bin/bash

# Sugar Sack Counter Backend Deployment Script
# Usage: ./deploy.sh [environment]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
APP_NAME="sugar-sack-counter"
APP_DIR="/opt/$APP_NAME"
DOCKER_COMPOSE_FILE="deploy/docker-compose.prod.yml"
BACKUP_DIR="/opt/backups/$APP_NAME"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_warning "Not running as root. Some operations may require sudo."
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    # Check if app directory exists
    if [ ! -d "$APP_DIR" ]; then
        log_error "Application directory $APP_DIR does not exist."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Backup database
backup_database() {
    log_info "Creating database backup..."

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    # Generate backup filename with timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

    # Backup PostgreSQL database
    if docker-compose -f "$APP_DIR/$DOCKER_COMPOSE_FILE" exec -T postgres pg_dump -U postgres sugar_sack_counter > "$BACKUP_FILE"; then
        log_success "Database backup created: $BACKUP_FILE"

        # Keep only last 7 backups
        cd "$BACKUP_DIR"
        ls -t db_backup_*.sql | tail -n +8 | xargs -r rm -f
    else
        log_warning "Failed to create database backup. Continuing deployment..."
    fi
}

# Pull latest changes
pull_changes() {
    log_info "Pulling latest changes from Git..."

    cd "$APP_DIR"

    if [ -d ".git" ]; then
        git pull origin main
        log_success "Git changes pulled successfully"
    else
        log_warning "Not a Git repository. Skipping Git pull."
    fi
}

# Update environment variables
update_environment() {
    log_info "Updating environment variables..."

    cd "$APP_DIR"

    # Check if .env file exists
    if [ ! -f ".env" ]; then
        log_warning ".env file not found. Creating from template..."
        if [ -f "deploy/.env.production" ]; then
            cp deploy/.env.production .env
            log_success "Created .env file from template"
        else
            log_error "Environment template not found at deploy/.env.production"
            exit 1
        fi
    fi

    # Update specific variables if provided
    if [ -n "$DB_PASSWORD" ]; then
        sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
    fi

    if [ -n "$JWT_SECRET" ]; then
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    fi

    log_success "Environment variables updated"
}

# Pull latest Docker images
pull_docker_images() {
    log_info "Pulling latest Docker images..."

    cd "$APP_DIR"

    if docker-compose -f "$DOCKER_COMPOSE_FILE" pull; then
        log_success "Docker images pulled successfully"
    else
        log_error "Failed to pull Docker images"
        exit 1
    fi
}

# Stop and remove old containers
stop_containers() {
    log_info "Stopping and removing old containers..."

    cd "$APP_DIR"

    if docker-compose -f "$DOCKER_COMPOSE_FILE" down; then
        log_success "Old containers stopped and removed"
    else
        log_warning "Failed to stop some containers. Continuing..."
    fi
}

# Start new containers
start_containers() {
    log_info "Starting new containers..."

    cd "$APP_DIR"

    if docker-compose -f "$DOCKER_COMPOSE_FILE" up -d; then
        log_success "Containers started successfully"
    else
        log_error "Failed to start containers"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."

    cd "$APP_DIR"

    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10

    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend npx prisma db push; then
        log_success "Database migrations completed"
    else
        log_error "Database migrations failed"
        exit 1
    fi
}

# Clean up Docker resources
cleanup_docker() {
    log_info "Cleaning up Docker resources..."

    # Remove unused Docker images
    docker image prune -f

    # Remove stopped containers
    docker container prune -f

    # Remove unused volumes (be careful with this)
    # docker volume prune -f

    log_success "Docker cleanup completed"
}

# Check application health
check_health() {
    log_info "Checking application health..."

    # Wait for application to start
    sleep 15

    # Try to access health endpoint
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Application is healthy"
        return 0
    else
        log_error "Application health check failed"

        # Show container logs for debugging
        log_info "Showing backend logs for debugging:"
        docker-compose -f "$APP_DIR/$DOCKER_COMPOSE_FILE" logs backend --tail=50

        return 1
    fi
}

# Show deployment summary
show_summary() {
    log_info "=== Deployment Summary ==="
    log_info "Environment: $ENVIRONMENT"
    log_info "Application: $APP_NAME"
    log_info "Directory: $APP_DIR"

    # Show running containers
    log_info "Running containers:"
    docker-compose -f "$APP_DIR/$DOCKER_COMPOSE_FILE" ps

    # Show application URLs
    log_info "Application URLs:"
    log_info "  - API: http://localhost:3000"
    log_info "  - API Docs: http://localhost:3000/api"
    log_info "  - MinIO Console: http://localhost:9001"

    # Get external IP if available
    if command -v curl &> /dev/null; then
        EXTERNAL_IP=$(curl -s ifconfig.me)
        if [ -n "$EXTERNAL_IP" ]; then
            log_info "External access:"
            log_info "  - API: http://$EXTERNAL_IP:3000"
        fi
    fi

    log_success "Deployment completed successfully!"
}

# Main deployment function
deploy() {
    log_info "Starting deployment of $APP_NAME ($ENVIRONMENT)"

    # Check if we're in the right directory
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        log_error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
        log_error "Please run this script from the application root directory"
        exit 1
    fi

    # Execute deployment steps
    check_root
    check_prerequisites
    backup_database
    pull_changes
    update_environment
    pull_docker_images
    stop_containers
    start_containers
    run_migrations
    cleanup_docker

    # Health check
    if check_health; then
        show_summary
    else
        log_error "Deployment failed. Application is not healthy."
        exit 1
    fi
}

# Rollback function
rollback() {
    log_info "Starting rollback..."

    # Stop current containers
    cd "$APP_DIR"
    docker-compose -f "$DOCKER_COMPOSE_FILE" down

    # Find latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null | head -1)

    if [ -n "$LATEST_BACKUP" ]; then
        log_info "Restoring from backup: $LATEST_BACKUP"

        # Start database container
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d postgres

        # Wait for database
        sleep 10

        # Restore database
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U postgres sugar_sack_counter < "$LATEST_BACKUP"

        log_success "Database restored from backup"
    else
        log_warning "No backup found. Cannot restore database."
    fi

    # Start previous version (if using tagged images)
    log_info "Starting previous version..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d

    log_success "Rollback completed"
}

# Show usage
usage() {
    echo "Sugar Sack Counter Backend Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy [environment]  Deploy the application (default: production)"
    echo "  rollback              Rollback to previous version"
    echo "  backup                Create database backup only"
    echo "  health                Check application health"
    echo "  logs                  Show application logs"
    echo "  help                  Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  DB_PASSWORD           Database password"
    echo "  JWT_SECRET            JWT secret key"
    echo ""
    echo "Examples:"
    echo "  $0 deploy production"
    echo "  DB_PASSWORD=secret $0 deploy"
    echo "  $0 rollback"
}

# Show logs
show_logs() {
    cd "$APP_DIR"
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f --tail=100
}

# Parse command line arguments
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    rollback)
        rollback
        ;;
    backup)
        backup_database
        ;;
    health)
        check_health
        ;;
    logs)
        show_logs
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        log_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac
