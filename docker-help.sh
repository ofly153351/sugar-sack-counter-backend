#!/bin/bash

# Docker Helper Script for Sugar Sack Counter Backend
# This script manages Docker containers for PostgreSQL and MinIO only
# Backend application runs locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to display usage
usage() {
    echo "Usage: $0 {start|stop|restart|logs|status|clean|help}"
    echo ""
    echo "Commands:"
    echo "  start     - Start PostgreSQL and MinIO services"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  logs      - Show logs from all services"
    echo "  logs:db   - Show database logs"
    echo "  logs:minio - Show MinIO logs"
    echo "  status    - Show service status"
    echo "  clean     - Stop and remove all containers and volumes"
    echo "  help      - Show this help message"
    echo ""
    echo "Environment:"
    echo "  Backend runs locally, services run in Docker containers"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs:db"
    echo "  $0 status"
}

# Function to start services
start_services() {
    print_info "Starting PostgreSQL and MinIO services..."
    docker-compose up -d
    print_success "Services started successfully!"

    print_info "Waiting for services to be ready..."
    sleep 10

    # Check if services are healthy
    check_services
}

# Function to stop services
stop_services() {
    print_info "Stopping services..."
    docker-compose down
    print_success "Services stopped successfully!"
}

# Function to restart services
restart_services() {
    print_info "Restarting services..."
    docker-compose restart
    print_success "Services restarted successfully!"
}

# Function to show logs
show_logs() {
    case "$1" in
        "db")
            print_info "Showing database logs..."
            docker-compose logs -f postgres
            ;;
        "minio")
            print_info "Showing MinIO logs..."
            docker-compose logs -f minio
            ;;
        "minio-client")
            print_info "Showing MinIO client logs..."
            docker-compose logs -f minio-client
            ;;
        *)
            print_info "Showing all logs..."
            docker-compose logs -f
            ;;
    esac
}

# Function to show service status
show_status() {
    print_info "Service Status:"
    docker-compose ps

    echo ""
    print_info "Resource Usage:"
    docker stats --no-stream

    echo ""
    print_info "Connection Information:"
    echo "  PostgreSQL: localhost:5432"
    echo "    Database: sugar_sack_counter"
    echo "    Username: postgres"
    echo "    Password: password"
    echo ""
    echo "  MinIO Console: http://localhost:9001"
    echo "    Username: minioadmin"
    echo "    Password: minioadmin"
    echo "    Bucket: sugar-sacks"
    echo ""
    echo "  Backend should connect to:"
    echo "    DATABASE_URL=postgresql://postgres:password@localhost:5432/sugar_sack_counter"
    echo "    MINIO_ENDPOINT=localhost:9000"
}

# Function to clean up everything
cleanup() {
    print_warning "This will stop all services and remove all containers, networks, and volumes!"
    print_warning "All data in PostgreSQL and MinIO will be lost!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleaning up Docker environment..."
        docker-compose down -v
        print_success "Cleanup completed!"
    else
        print_info "Cleanup cancelled."
    fi
}

# Function to check service health
check_services() {
    print_info "Checking service health..."

    # Check PostgreSQL
    if docker-compose exec postgres pg_isready -U postgres >/dev/null 2>&1; then
        print_success "PostgreSQL is healthy"
    else
        print_warning "PostgreSQL health check failed"
    fi

    # Check MinIO
    if curl -f http://localhost:9000/minio/health/live >/dev/null 2>&1; then
        print_success "MinIO is healthy"
    else
        print_warning "MinIO health check failed"
    fi

    echo ""
    print_info "Services are ready for local backend development"
    echo "  Backend should use:"
    echo "  - Database: postgresql://postgres:password@localhost:5432/sugar_sack_counter"
    echo "  - MinIO: http://localhost:9000"
}

# Function to access database shell
db_shell() {
    print_info "Accessing PostgreSQL shell..."
    docker-compose exec postgres psql -U postgres -d sugar_sack_counter
}

# Function to backup database
backup_db() {
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    print_info "Creating database backup: $backup_file"
    docker-compose exec postgres pg_dump -U postgres sugar_sack_counter > "$backup_file"

    if [ $? -eq 0 ]; then
        print_success "Backup created successfully: $backup_file"
    else
        print_error "Backup failed!"
    fi
}

# Function to restore database
restore_db() {
    local backup_file="$1"
    if [ -z "$backup_file" ]; then
        print_error "Please specify a backup file"
        echo "Usage: $0 restore <backup_file.sql>"
        exit 1
    fi

    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi

    print_warning "This will overwrite the current database!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Restoring database from: $backup_file"
        docker-compose exec -T postgres psql -U postgres -d sugar_sack_counter < "$backup_file"

        if [ $? -eq 0 ]; then
            print_success "Database restored successfully!"
        else
            print_error "Database restore failed!"
        fi
    else
        print_info "Restore cancelled."
    fi
}

# Function to show MinIO bucket contents
minio_list() {
    print_info "Listing MinIO bucket contents..."
    docker-compose exec minio-client /usr/bin/mc ls myminio/sugar-sacks/
}

# Main script logic
case "$1" in
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "logs")
        show_logs "$2"
        ;;
    "logs:db")
        show_logs "db"
        ;;
    "logs:minio")
        show_logs "minio"
        ;;
    "logs:minio-client")
        show_logs "minio-client"
        ;;
    "status")
        show_status
        ;;
    "db:shell")
        db_shell
        ;;
    "db:backup")
        backup_db
        ;;
    "db:restore")
        restore_db "$2"
        ;;
    "minio:list")
        minio_list
        ;;
    "clean")
        cleanup
        ;;
    "help"|"")
        usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        usage
        exit 1
        ;;
esac
