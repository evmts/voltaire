#!/bin/bash

# Script to run all opcode tests and identify failures
OPCODES=(00 01 02 03 04 05 06 07 08 09 0a 0b 10 11 12 13 14 15 16 17 18 19 1a 1b 1c 1d 20 32 33 34 35 36 37 38 39 3d 3e 40 41 44 46 49 50 51 52 53 54 55 56 58 59 5b 5c 5d 5e 5f 60 61 62 63 64 65 66 67 68 69 6a 6b 6c 6d 6e 6f 70 71 72 73 74 75 76 77 78 79 7a 7b 7c 7d 7e 7f 80 81 82 83 84 85 86 87 88 89 8a 8b 8c 8d 8e 8f 90 91 92 93 94 95 96 97 98 99 9a 9b 9c 9d 9e 9f a0 a1 a2 a3 a4 f0 f1 f2 f3 f4 f5 f6 f7 fa fd fe ff)

FAILING_TESTS=()
PASSING_TESTS=()

echo "Running all opcode tests..."
echo "=========================="

for opcode in "${OPCODES[@]}"; do
    echo -n "Testing opcode 0x$opcode... "
    
    # Run the test and capture both stdout and stderr
    if output=$(zig build test-opcodes-0x$opcode 2>&1); then
        if [[ -z "$output" ]]; then
            echo "PASS (no output - normal for passing Zig tests)"
            PASSING_TESTS+=($opcode)
        else
            echo "PASS (with output)"
            PASSING_TESTS+=($opcode)
            echo "  Output: $output"
        fi
    else
        echo "FAIL"
        FAILING_TESTS+=($opcode)
        echo "  Error: $output"
        echo
    fi
done

echo
echo "=========================="
echo "SUMMARY"
echo "=========================="
echo "Total tests: ${#OPCODES[@]}"
echo "Passing tests: ${#PASSING_TESTS[@]}"
echo "Failing tests: ${#FAILING_TESTS[@]}"
echo

if [ ${#FAILING_TESTS[@]} -gt 0 ]; then
    echo "FAILING OPCODES:"
    for opcode in "${FAILING_TESTS[@]}"; do
        echo "  0x$opcode"
    done
else
    echo "All tests are passing!"
fi