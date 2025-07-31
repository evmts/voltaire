#!/bin/bash
# Run comprehensive test and extract failing test names
./target/debug/comprehensive_opcode_comparison 2>&1 | grep -v "debug:" | awk '
/^Testing/ { section=$0; test_num=0 }
/^  [A-Z]+:/ { test_num++; test_name=$0 }
/^✅ PASS|^❌ FAIL/ {
    if ($0 ~ /FAIL/) {
        print section " - Test #" test_num ": " test_name
        getline; print "    " $0
        getline; print "    " $0
    }
}'