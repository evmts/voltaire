#!/bin/bash

set -Eeuo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "${SCRIPT_DIR}/.." && pwd)
FIXTURE_DIR="${ROOT_DIR}/src/evm/fixtures/snailtracer"

# Build the Zig EVM runner
echo "Building Zig EVM runner..."
cd "${ROOT_DIR}"
zig build build-evm-runner -Doptimize=ReleaseFast

# Run the snailtracer test once
echo "Running snailtracer test..."
"${ROOT_DIR}/zig-out/bin/evm-runner" \
  --contract-code-path "${FIXTURE_DIR}/bytecode.txt" \
  --calldata "30627b7c" \
  --num-runs 1

echo "Test completed successfully!"