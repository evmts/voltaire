#!/usr/bin/env python3
"""
Fix Tracy import placement in execution files
"""

import os
import re

def fix_tracy_import(filepath):
    """Move tracy import to the correct location"""
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if tracy import exists at the bottom
    if 'const tracy = @import("../tracy_support.zig");' not in content:
        return False
        
    # Remove tracy import from wherever it is
    content = content.replace('const tracy = @import("../tracy_support.zig");\n', '')
    content = content.replace('const tracy = @import("../tracy_support.zig");', '')
    
    # Find the last import line
    import_pattern = r'(const \w+ = @import\([^)]+\);)'
    imports = list(re.finditer(import_pattern, content))
    
    if imports:
        # Find the last import that's not tracy
        last_import = None
        for imp in imports:
            if 'tracy' not in imp.group(0):
                last_import = imp
        
        if last_import:
            insert_pos = last_import.end()
            content = content[:insert_pos] + '\nconst tracy = @import("../tracy_support.zig");' + content[insert_pos:]
            
            with open(filepath, 'w') as f:
                f.write(content)
            return True
    
    return False

def main():
    execution_dir = "/Users/williamcory/Guillotine/src/evm/execution"
    
    # Files to fix
    files = [
        "storage.zig",
        "environment.zig", 
        "crypto.zig",
        "comparison.zig",
        "stack.zig"
    ]
    
    print("Fixing Tracy import placement...")
    
    for filename in files:
        filepath = os.path.join(execution_dir, filename)
        if os.path.exists(filepath):
            if fix_tracy_import(filepath):
                print(f"Fixed {filename}")
            else:
                print(f"No changes needed for {filename}")
    
    print("Done!")

if __name__ == "__main__":
    main()