#!/bin/bash

# Script to identify only failing opcode tests
OPCODES=(00 01 02 03 04 05 06 07 08 09 0a 0b 10 11 12 13 14 15 16 17 18 19 1a 1b 1c 1d 20 32 33 34 35 36 37 38 39 3d 3e 40 41 44 46 49 50 51 52 53 54 55 56 58 59 5b 5c 5d 5e 5f 60 61 62 63 64 65 66 67 68 69 6a 6b 6c 6d 6e 6f 70 71 72 73 74 75 76 77 78 79 7a 7b 7c 7d 7e 7f 80 81 82 83 84 85 86 87 88 89 8a 8b 8c 8d 8e 8f 90 91 92 93 94 95 96 97 98 99 9a 9b 9c 9d 9e 9f a0 a1 a2 a3 a4 f0 f1 f2 f3 f4 f5 f6 f7 fa fd fe ff)

FAILING_TESTS=()
PASSING_TESTS=()
COMPILATION_ERRORS=()

echo "Testing opcode tests for failures only..."
echo "========================================"

for opcode in "${OPCODES[@]}"; do
    echo -n "0x$opcode... "
    
    # Run the test and capture only exit code
    if zig build test-opcodes-0x$opcode >/dev/null 2>&1; then
        echo "PASS"
        PASSING_TESTS+=($opcode)
    else
        # Check if it's a compilation error vs test failure
        if output=$(zig build test-opcodes-0x$opcode 2>&1); then
            if [[ "$output" == *"compilation errors"* ]] || [[ "$output" == *"no field named 'items'"* ]]; then
                echo "COMPILATION ERROR"
                COMPILATION_ERRORS+=($opcode)
            else
                echo "TEST FAILURE"
                FAILING_TESTS+=($opcode)
            fi
        else
            echo "FAIL"
            FAILING_TESTS+=($opcode)
        fi
    fi
done

echo
echo "SUMMARY:"
echo "========"
echo "Total tests: ${#OPCODES[@]}"
echo "Passing tests: ${#PASSING_TESTS[@]}"
echo "Compilation errors: ${#COMPILATION_ERRORS[@]}" 
echo "Test failures: ${#FAILING_TESTS[@]}"

if [ ${#COMPILATION_ERRORS[@]} -gt 0 ]; then
    echo
    echo "COMPILATION ERRORS:"
    for opcode in "${COMPILATION_ERRORS[@]}"; do
        echo "  0x$opcode"
    done
fi

if [ ${#FAILING_TESTS[@]} -gt 0 ]; then
    echo
    echo "TEST FAILURES:"
    for opcode in "${FAILING_TESTS[@]}"; do
        echo "  0x$opcode"
    done
fi

echo
echo "PASSING TESTS:"
for opcode in "${PASSING_TESTS[@]}"; do
    echo "  0x$opcode"
done