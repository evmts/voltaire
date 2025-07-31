#!/bin/bash
# Run comprehensive opcode comparison and show failing tests with names
./target/debug/comprehensive_opcode_comparison 2>&1 | grep -v "debug:" | awk '
    /^  [A-Z]+:/ { test_name = $0; }
    /❌ FAIL/ { 
        print test_name " ❌ FAIL";
        getline; print $0;
        getline; print $0;
        print "";
    }
    /=== Final Summary ===/ { print; getline; print; getline; print; }
'