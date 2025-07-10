#!/bin/bash

# Fix all test files with the proper import pattern
find test -name "*.zig" -type f | while read file; do
    echo "Processing: $file"
    
    # Remove duplicate const Evm = Evm.XXX lines
    sed -i '' '/^const Evm = Evm\./d' "$file"
    
    # Fix type references from Evm to Evm.Evm where needed
    sed -i '' 's/EVM = Evm\.Evm;/EVM = Evm.Evm;/g' "$file"
    
    # Fix other module references - change evm.XXX to Evm.XXX
    sed -i '' 's/const \([A-Za-z_]*\) = evm\./const \1 = Evm./g' "$file"
done

echo "All test files have been updated!"