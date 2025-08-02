#!/usr/bin/env python3
"""
Script to add Tracy instrumentation to all opcode functions in the execution directory
"""

import os
import re
import sys

def instrument_file(filepath):
    """Add Tracy zones to all op_* functions in a file"""
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if already has tracy import
    if 'tracy = @import("../tracy_support.zig")' not in content:
        # Find the last import line
        import_pattern = r'(const \w+ = @import\([^)]+\);)'
        imports = list(re.finditer(import_pattern, content))
        if imports:
            last_import = imports[-1]
            insert_pos = last_import.end()
            content = content[:insert_pos] + '\nconst tracy = @import("../tracy_support.zig");' + content[insert_pos:]
    
    # Find all opcode functions
    op_pattern = r'(pub fn (op_\w+)\([^)]+\)[^{]+\{)'
    
    modified = False
    offset = 0
    
    for match in re.finditer(op_pattern, content):
        func_start = match.end() + offset
        func_name = match.group(2)
        
        # Check if already instrumented
        check_area = content[func_start:func_start + 200]
        if 'tracy.zone' in check_area:
            continue
        
        # Insert Tracy zone
        zone_code = f'\n    const zone = tracy.zone(@src(), "{func_name}\\x00");\n    defer zone.end();\n    '
        content = content[:func_start] + zone_code + content[func_start:]
        offset += len(zone_code)
        modified = True
        print(f"  Instrumented {func_name}")
    
    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

def main():
    execution_dir = "/Users/williamcory/Guillotine/src/evm/execution"
    
    # Files to instrument
    files = [
        "arithmetic.zig",
        "bitwise.zig", 
        "block.zig",
        "comparison.zig",
        "control.zig",
        "crypto.zig",
        "environment.zig",
        "log.zig",
        "memory.zig",
        "stack.zig",
        "storage.zig",
        "system.zig"
    ]
    
    print("Adding Tracy instrumentation to execution opcodes...")
    
    total_modified = 0
    for filename in files:
        filepath = os.path.join(execution_dir, filename)
        if os.path.exists(filepath):
            print(f"\nProcessing {filename}...")
            if instrument_file(filepath):
                total_modified += 1
        else:
            print(f"Warning: {filename} not found")
    
    print(f"\nCompleted! Modified {total_modified} files.")

if __name__ == "__main__":
    main()