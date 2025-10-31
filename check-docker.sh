#!/bin/bash

# Docker Installation Check Script for Sugar Sack Counter Backend
# This script checks if Docker and Docker Compose are installed and provides installation instructions

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect operating system
detect_os() {
    case "$(uname -s)" in
        Darwin)
            echo "macos"
            ;;
        Linux)
            if [ -f /etc/os-release ]; then
                . /etc/os-release
                echo "$ID"
            else
                echo "linux"
            fi
            ;;
        CYGWIN*|MINGW32*|MSYS*|MINGW*)
            echo "windows"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Function to check Docker installation
check_docker() {
    print_info "Checking Docker installation..."

    if command_exists docker; then
        DOCKER_VERSION=$(docker --version 2>/dev/null | cut -d' ' -f3 | sed 's/,//')
        print_success "Docker is installed: $DOCKER_VERSION"
        return 0
    else
        print_error "Docker is not installed"
        return 1
    fi
}

# Function to check Docker Compose installation
check_docker_compose() {
    print_info "Checking Docker Compose installation..."

    if command_exists docker-compose; then
        DOCKER_COMPOSE_VERSION=$(docker-compose --version 2>/dev/null | cut -d' ' -f3 | sed 's/,//')
        print_success "Docker Compose is installed: $DOCKER_COMPOSE_VERSION"
        return 0
    elif command_exists docker && docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_VERSION=$(docker compose version 2>/dev/null | grep -oP 'version \K[^,]+')
        print_success "Docker Compose (plugin) is installed: $DOCKER_COMPOSE_VERSION"
        return 0
    else
        print_error "Docker Compose is not installed"
        return 1
    fi
}

# Function to check if user is in docker group
check_docker_group() {
    if command_exists docker && ! docker info >/dev/null 2>&1; then
        print_warning "Docker is installed but you don't have permission to use it"
        print_info "You might need to add your user to the 'docker' group:"
        print_info "  sudo usermod -aG docker $USER"
        print_info "Then log out and log back in, or restart your system."
        return 1
    fi
    return 0
}

# Function to show installation instructions
show_installation_instructions() {
    local os=$(detect_os)

    echo ""
    print_info "Installation instructions for $os:"
    echo ""

    case "$os" in
        "macos")
            echo "1. Install Docker Desktop for Mac:"
            echo "   Download from: https://www.docker.com/products/docker-desktop/"
            echo "   Or use Homebrew:"
            echo "   brew install --cask docker"
            echo ""
            echo "2. After installation, open Docker Desktop from Applications"
            echo "3. Docker Compose is included with Docker Desktop"
            ;;
        "ubuntu"|"debian")
            echo "1. Update package index:"
            echo "   sudo apt update"
            echo ""
            echo "2. Install Docker:"
            echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
            echo "   sh get-docker.sh"
            echo ""
            echo "3. Add your user to docker group:"
            echo "   sudo usermod -aG docker $USER"
            echo ""
            echo "4. Install Docker Compose:"
            echo "   sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose"
            echo "   sudo chmod +x /usr/local/bin/docker-compose"
            echo ""
            echo "5. Log out and log back in, or restart your system"
            ;;
        "centos"|"rhel"|"fedora")
            echo "1. Install Docker:"
            echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
            echo "   sh get-docker.sh"
            echo ""
            echo "2. Start Docker service:"
            echo "   sudo systemctl start docker"
            echo "   sudo systemctl enable docker"
            echo ""
            echo "3. Add your user to docker group:"
            echo "   sudo usermod -aG docker $USER"
            echo ""
            echo "4. Install Docker Compose:"
            echo "   sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose"
            echo "   sudo chmod +x /usr/local/bin/docker-compose"
            echo ""
            echo "5. Log out and log back in, or restart your system"
            ;;
        "windows")
            echo "1. Install Docker Desktop for Windows:"
            echo "   Download from: https://www.docker.com/products/docker-desktop/"
            echo ""
            echo "2. Enable WSL 2 (Windows Subsystem for Linux 2) if prompted"
            echo "3. Docker Compose is included with Docker Desktop"
            ;;
        *)
            echo "Please visit https://docs.docker.com/get-docker/ for installation instructions"
            ;;
    esac

    echo ""
    print_info "After installation, verify with:"
    echo "  docker --version"
    echo "  docker-compose --version"
    echo ""
    print_info "Then run this script again to verify the installation."
}

# Function to test Docker functionality
test_docker() {
    print_info "Testing Docker functionality..."

    if docker run --rm hello-world >/dev/null 2>&1; then
        print_success "Docker is working correctly"
        return 0
    else
        print_error "Docker test failed"
        return 1
    fi
}

# Function to show system information
show_system_info() {
    print_info "System Information:"
    echo "  OS: $(uname -s)"
    echo "  Architecture: $(uname -m)"
    echo "  Kernel: $(uname -r)"

    local os=$(detect_os)
    if [ "$os" != "unknown" ]; then
        echo "  Detected OS: $os"
    fi
}

# Main function
main() {
    echo "=========================================="
    echo "  Docker Installation Check"
    echo "  Sugar Sack Counter Backend"
    echo "=========================================="
    echo ""

    show_system_info
    echo ""

    local docker_installed=true
    local docker_compose_installed=true
    local docker_working=true

    # Check Docker
    if ! check_docker; then
        docker_installed=false
    fi

    # Check Docker Compose
    if ! check_docker_compose; then
        docker_compose_installed=false
    fi

    # Check Docker permissions if Docker is installed
    if [ "$docker_installed" = true ]; then
        if ! check_docker_group; then
            docker_working=false
        elif ! test_docker; then
            docker_working=false
        fi
    fi

    echo ""

    # Summary
    if [ "$docker_installed" = true ] && [ "$docker_compose_installed" = true ] && [ "$docker_working" = true ]; then
        print_success "All Docker requirements are satisfied!"
        echo ""
        print_info "You can now run the Sugar Sack Counter backend with:"
        echo "  ./docker-help.sh start"
        echo ""
        print_info "For more options, run: ./docker-help.sh help"
    else
        print_warning "Some Docker requirements are missing or not working properly"
        echo ""

        if [ "$docker_installed" = false ] || [ "$docker_compose_installed" = false ]; then
            show_installation_instructions
        fi

        if [ "$docker_working" = false ] && [ "$docker_installed" = true ]; then
            echo ""
            print_info "Docker is installed but not working properly."
            print_info "Try restarting Docker Desktop or your system."
        fi
    fi

    echo ""
    echo "=========================================="
}

# Run main function
main "$@"
