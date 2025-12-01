#!/bin/bash

# AI Integration Test Script
# This script tests the integration between NestJS and Rust AI service

set -e

echo "🧪 AI Integration Test"
echo "======================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RUST_SERVICE_URL="http://localhost:5000"
NESTJS_SERVICE_URL="http://localhost:3000"
TEST_IMAGE="test-image.jpg"

# Function to print colored output
print_status() {
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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."

    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        print_warning "jq is not installed - JSON responses won't be formatted"
    fi

    print_success "Dependencies check passed"
}

# Check if services are running
check_services() {
    print_status "Checking if services are running..."

    # Check Rust AI service
    if curl -s --head --request GET "$RUST_SERVICE_URL/detect" > /dev/null; then
        print_success "Rust AI service is running on $RUST_SERVICE_URL"
    else
        print_error "Rust AI service is not running on $RUST_SERVICE_URL"
        print_status "Start it with: cd ai-service && ./start.sh"
        exit 1
    fi

    # Check NestJS service
    if curl -s --head --request GET "$NESTJS_SERVICE_URL" > /dev/null; then
        print_success "NestJS service is running on $NESTJS_SERVICE_URL"
    else
        print_error "NestJS service is not running on $NESTJS_SERVICE_URL"
        print_status "Start it with: npm run start:dev"
        exit 1
    fi
}

# Create a test image if it doesn't exist
create_test_image() {
    if [ ! -f "$TEST_IMAGE" ]; then
        print_status "Creating test image..."
        # Create a simple 100x100 red image using ImageMagick
        if command -v convert &> /dev/null; then
            convert -size 100x100 xc:red "$TEST_IMAGE"
            print_success "Created test image: $TEST_IMAGE"
        else
            print_warning "ImageMagick not installed - using existing test image if available"
            if [ ! -f "$TEST_IMAGE" ]; then
                print_error "No test image available. Please create a test image named $TEST_IMAGE"
                exit 1
            fi
        fi
    else
        print_status "Using existing test image: $TEST_IMAGE"
    fi
}

# Test Rust AI service directly
test_rust_service() {
    print_status "Testing Rust AI service directly..."

    if [ ! -f "$TEST_IMAGE" ]; then
        print_error "Test image not found: $TEST_IMAGE"
        return 1
    fi

    response=$(curl -s -X POST \
        -F "image=@$TEST_IMAGE" \
        "$RUST_SERVICE_URL/detect")

    if command -v jq &> /dev/null; then
        echo "$response" | jq .
    else
        echo "$response"
    fi

    # Check if response contains expected fields
    if echo "$response" | grep -q '"status"' && echo "$response" | grep -q '"person_count"'; then
        print_success "Rust AI service test passed"
        return 0
    else
        print_error "Rust AI service test failed"
        return 1
    fi
}

# Test NestJS AI endpoint
test_nestjs_service() {
    print_status "Testing NestJS AI endpoint..."

    if [ ! -f "$TEST_IMAGE" ]; then
        print_error "Test image not found: $TEST_IMAGE"
        return 1
    fi

    response=$(curl -s -X POST \
        -F "image=@$TEST_IMAGE" \
        "$NESTJS_SERVICE_URL/ai/detect")

    if command -v jq &> /dev/null; then
        echo "$response" | jq .
    else
        echo "$response"
    fi

    # Check if response contains expected fields
    if echo "$response" | grep -q '"person_count"'; then
        print_success "NestJS AI endpoint test passed"
        return 0
    else
        print_error "NestJS AI endpoint test failed"
        return 1
    fi
}

# Run performance test
performance_test() {
    print_status "Running performance test (3 consecutive requests)..."

    if [ ! -f "$TEST_IMAGE" ]; then
        print_error "Test image not found: $TEST_IMAGE"
        return 1
    fi

    for i in {1..3}; do
        print_status "Request $i..."
        start_time=$(date +%s%3N)

        response=$(curl -s -X POST \
            -F "image=@$TEST_IMAGE" \
            "$NESTJS_SERVICE_URL/ai/detect")

        end_time=$(date +%s%3N)
        duration=$((end_time - start_time))

        person_count=$(echo "$response" | grep -o '"person_count":[0-9]*' | cut -d: -f2)

        print_status "Response time: ${duration}ms, Person count: ${person_count}"
    done

    print_success "Performance test completed"
}

# Main test execution
main() {
    echo ""
    print_status "Starting AI Integration Tests"
    echo "==================================="

    check_dependencies
    echo ""

    check_services
    echo ""

    create_test_image
    echo ""

    print_status "Phase 1: Testing Rust AI Service"
    echo "--------------------------------------"
    if test_rust_service; then
        print_success "✅ Rust AI Service: PASSED"
    else
        print_error "❌ Rust AI Service: FAILED"
        exit 1
    fi
    echo ""

    print_status "Phase 2: Testing NestJS Integration"
    echo "-----------------------------------------"
    if test_nestjs_service; then
        print_success "✅ NestJS Integration: PASSED"
    else
        print_error "❌ NestJS Integration: FAILED"
        exit 1
    fi
    echo ""

    print_status "Phase 3: Performance Testing"
    echo "----------------------------------"
    performance_test
    echo ""

    echo "==================================="
    print_success "All tests completed successfully! 🎉"
    echo ""
    print_status "Summary:"
    echo "- Rust AI Service: ✅ Running and responding"
    echo "- NestJS Integration: ✅ Properly forwarding requests"
    echo "- Performance: ✅ Tested with multiple requests"
    echo ""
    print_status "Your AI integration is working correctly!"
}

# Run main function
main "$@"
