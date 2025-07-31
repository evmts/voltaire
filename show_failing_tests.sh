#!/bin/bash
# Show failing tests with their positions
./target/debug/comprehensive_opcode_comparison 2>&1 | grep -v "debug:" | awk '
BEGIN { 
    test_num = 0
    section = ""
}
/Testing.*Opcodes:/ { 
    section = $0
    test_num = 0
}
/^  [A-Z]+:/ { 
    test_num++
    test_name = $0
}
/PASS|FAIL/ {
    status = $0
    if (status ~ /FAIL/) {
        print section " - Test #" test_num ": " test_name " " status
        getline
        print "    " $0
        getline
        print "    " $0
        print ""
    }
}'