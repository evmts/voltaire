#!/bin/bash
# EVM2 Fuzz Testing Runner Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DURATION="${FUZZ_DURATION:-300}"
TEST_FILE="${FUZZ_TEST:-evm2/fuzz/evm2_fuzz.zig}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[FUZZ]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running. Please start Docker."
    exit 1
fi

# Parse command line arguments
case "$1" in
    "help"|"-h"|"--help")
        echo "EVM2 Fuzz Testing Runner"
        echo ""
        echo "Usage: ./run-fuzz.sh [command] [options]"
        echo ""
        echo "Commands:"
        echo "  quick       Run quick fuzz test (60 seconds)"
        echo "  normal      Run normal fuzz test (300 seconds, default)"
        echo "  long        Run extended fuzz test (1 hour)"
        echo "  continuous  Run continuous fuzzing (restarts on completion)"
        echo "  shell       Open interactive shell in fuzz container"
        echo "  build       Build the Docker image"
        echo "  help        Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  FUZZ_DURATION  Set custom duration in seconds"
        echo "  FUZZ_TEST      Set specific test file to run"
        echo ""
        echo "Examples:"
        echo "  ./run-fuzz.sh quick"
        echo "  FUZZ_DURATION=600 ./run-fuzz.sh"
        echo "  FUZZ_TEST=specific_test.zig ./run-fuzz.sh"
        exit 0
        ;;
    "quick")
        DURATION=60
        print_status "Running quick fuzz test (60 seconds)..."
        ;;
    "normal"|"")
        print_status "Running normal fuzz test (${DURATION} seconds)..."
        ;;
    "long")
        DURATION=3600
        print_status "Running extended fuzz test (1 hour)..."
        ;;
    "continuous")
        print_status "Starting continuous fuzzing (Ctrl+C to stop)..."
        docker-compose up fuzz-continuous
        exit 0
        ;;
    "shell")
        print_status "Opening interactive shell..."
        docker-compose run fuzz-shell
        exit 0
        ;;
    "build")
        print_status "Building Docker image..."
        docker-compose build fuzz
        print_status "Build complete!"
        exit 0
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Run './run-fuzz.sh help' for usage information"
        exit 1
        ;;
esac

# Build image if it doesn't exist
if ! docker image inspect guillotine-evm2-fuzz &> /dev/null; then
    print_warning "Docker image not found. Building..."
    docker-compose build fuzz
fi

# Run the fuzz test
print_status "Starting fuzz test..."
print_status "Duration: ${DURATION} seconds"
print_status "Test file: ${TEST_FILE}"
echo ""

# Run with environment variables
FUZZ_DURATION=${DURATION} FUZZ_TEST=${TEST_FILE} docker-compose run fuzz-single

# Check exit code
if [ $? -eq 0 ]; then
    print_status "Fuzz testing completed successfully!"
else
    print_error "Fuzz testing found issues or failed!"
    exit 1
fi