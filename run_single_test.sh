#!/bin/bash
# Run comprehensive test and show all tests with their results
./target/debug/comprehensive_opcode_comparison 2>&1 | grep -v "debug:" | awk '
/^  [A-Z]+:/ { 
    # Capture test name and wait for result on next line
    test_name = $0
    getline result
    
    # Print test name with result
    if (result ~ /PASS/) {
        print "✅", test_name
    } else if (result ~ /FAIL/) {
        print "❌", test_name
        # Get the error details
        getline; print "   ", $0
        getline; print "   ", $0
    }
}'