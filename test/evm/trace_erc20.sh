#!/bin/bash
# Script to capture full ERC20 execution trace to a file

echo "Running ERC20 debug test and capturing trace to erc20_full_trace.log..."
zig build test-erc20-debug 2>&1 | tee erc20_full_trace.log
echo "Trace complete. Output saved to erc20_full_trace.log"