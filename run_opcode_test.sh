#!/bin/bash
# Run comprehensive opcode comparison without debug output
export ZIG_LOG_LEVEL=err
./target/debug/comprehensive_opcode_comparison 2>&1 | grep -v "debug:"