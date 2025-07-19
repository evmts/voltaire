#!/bin/bash

# Script to convert Frame.init_minimal to builder pattern across multiple files

files=$(find /Users/williamcory/Guillotine/worktrees/issue-84/test -name "*.zig" -exec grep -l "Frame\.init_minimal" {} \;)

for file in $files; do
    echo "Converting $file..."
    
    # Pattern 1: Most common pattern with 1000 gas
    sed -i '' 's/    var frame = try Frame\.init_minimal(allocator, &contract);[[:space:]]*defer frame\.deinit();[[:space:]]*frame\.gas_remaining = 1000;/    var frame_builder = Frame.builder(allocator);\
    var frame = try frame_builder\
        .withVm(\&evm)\
        .withContract(\&contract)\
        .withGas(1000)\
        .build();\
    defer frame.deinit();/g' "$file"
    
    # Pattern 2: 10000 gas
    sed -i '' 's/    var frame = try Frame\.init_minimal(allocator, &contract);[[:space:]]*defer frame\.deinit();[[:space:]]*frame\.gas_remaining = 10000;/    var frame_builder = Frame.builder(allocator);\
    var frame = try frame_builder\
        .withVm(\&evm)\
        .withContract(\&contract)\
        .withGas(10000)\
        .build();\
    defer frame.deinit();/g' "$file"
    
    # Pattern 3: 100000 gas  
    sed -i '' 's/    var frame = try Frame\.init_minimal(allocator, &contract);[[:space:]]*defer frame\.deinit();[[:space:]]*frame\.gas_remaining = 100000;/    var frame_builder = Frame.builder(allocator);\
    var frame = try frame_builder\
        .withVm(\&evm)\
        .withContract(\&contract)\
        .withGas(100000)\
        .build();\
    defer frame.deinit();/g' "$file"
done

echo "Conversion complete!"