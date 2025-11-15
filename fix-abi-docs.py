#!/usr/bin/env python3
"""
Script to update ABI documentation to use data-first pattern.
Converts from:
  - new Function({...}) -> {...} as const
  - fn.getSelector() -> Abi.Function.getSelector(fn)
  - import { Function } -> import * as Abi
"""

import re
import os
from pathlib import Path

# Map of old constructor patterns to new namespaces
CONSTRUCTORS = {
    'Function': 'Function',
    'Event': 'Event',
    'AbiError': 'Error',
    'Constructor': 'Constructor',
    'Parameter': 'Parameter',
}

def fix_imports(content):
    """Fix import statements"""
    # Replace individual imports with namespace import
    patterns = [
        (r"import\s+\{\s*Function\s*\}\s+from\s+['\"]@tevm/voltaire['\"]",
         "import * as Abi from '@tevm/voltaire/Abi'"),
        (r"import\s+\{\s*Event\s*\}\s+from\s+['\"]@tevm/voltaire['\"]",
         "import * as Abi from '@tevm/voltaire/Abi'"),
        (r"import\s+\{\s*AbiError\s*\}\s+from\s+['\"]@tevm/voltaire['\"]",
         "import * as Abi from '@tevm/voltaire/Abi'"),
        (r"import\s+\{\s*Constructor\s*\}\s+from\s+['\"]@tevm/voltaire['\"]",
         "import * as Abi from '@tevm/voltaire/Abi'"),
        (r"import\s+\{\s*Keccak256\s*\}\s+from\s+['\"]@tevm/voltaire['\"]",
         "import * as Keccak256 from '@tevm/voltaire/Keccak256'"),
    ]

    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)

    return content

def fix_constructors(content):
    """Fix constructor calls - remove 'new' and add 'as const'"""
    # Fix new Function({...}) -> {...} as const
    # This is complex because we need to match balanced braces

    for old_name in CONSTRUCTORS.keys():
        # Simple pattern for now - assumes the object is on one or few lines
        # Pattern: new Constructor({ ... })
        pattern = rf'new\s+{old_name}\s*\(\s*\{{'
        replacement = r'{'
        content = re.sub(pattern, replacement, content)

    # Add 'as const' after closing brace of object literals that were constructors
    # Look for patterns like } followed by )
    # This is a heuristic - add } as const before closing paren of what was a constructor call

    # Fix }) -> } as const (for single-line or when } is followed by ))
    content = re.sub(r'\}\s*\)\s*$', '} as const', content, flags=re.MULTILINE)
    content = re.sub(r'\}\s*\)\s*\n', '} as const\n', content)

    # For patterns like:
    #   ]
    # })
    # Replace }) with } as const
    content = re.sub(r'^(\s*)\}\)(\s*)$', r'\1} as const\2', content, flags=re.MULTILINE)

    return content

def fix_method_calls(content):
    """Fix method calls from fn.method() to Abi.Type.method(fn)"""
    # This is the trickiest part
    # Pattern: variableName.methodName(...) -> Abi.Type.methodName(variableName, ...)

    # Common method names and their types
    method_map = {
        'getSelector': ('Function', 'Event', 'Error'),
        'getSignature': ('Function', 'Event', 'Error'),
        'encodeParams': ('Function', 'Error', 'Constructor'),
        'decodeParams': ('Function', 'Error', 'Constructor'),
        'encodeResult': ('Function',),
        'decodeResult': ('Function',),
        'encodeTopics': ('Event',),
        'decodeLog': ('Event',),
    }

    # Look for patterns like: variableFn.getSelector()
    # We need to infer the type from variable naming convention

    def determine_type(var_name):
        """Determine ABI type from variable name"""
        var_lower = var_name.lower()
        if 'event' in var_lower:
            return 'Event'
        elif 'error' in var_lower:
            return 'Error'
        elif 'constructor' in var_lower or 'ctor' in var_lower:
            return 'Constructor'
        else:
            return 'Function'  # default

    # Pattern: varName.methodName(args)
    pattern = r'(\w+)\.(getSelector|getSignature|encodeParams|decodeParams|encodeResult|decodeResult|encodeTopics|decodeLog)\s*\('

    def replace_method(match):
        var_name = match.group(1)
        method_name = match.group(2)
        abi_type = determine_type(var_name)
        return f'Abi.{abi_type}.{method_name}({var_name}, '

    # Replace method calls with args
    content = re.sub(pattern + r'([^)]+)\)', lambda m: replace_method(m) + m.group(3) + ')', content)

    # Handle no-arg methods separately: varName.method()
    pattern_noargs = r'(\w+)\.(getSelector|getSignature)\s*\(\s*\)'

    def replace_noargs(match):
        var_name = match.group(1)
        method_name = match.group(2)
        abi_type = determine_type(var_name)
        return f'Abi.{abi_type}.{method_name}({var_name})'

    content = re.sub(pattern_noargs, replace_noargs, content)

    return content

def process_file(filepath):
    """Process a single MDX file"""
    print(f"Processing: {filepath}")

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Apply fixes
    content = fix_imports(content)
    content = fix_constructors(content)
    content = fix_method_calls(content)

    # Only write if changed
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    """Process all ABI documentation files"""
    abi_dir = Path('/Users/williamcory/voltaire/docs/primitives/abi')

    changed_files = []
    for mdx_file in abi_dir.rglob('*.mdx'):
        if process_file(mdx_file):
            changed_files.append(mdx_file)

    print(f"\nUpdated {len(changed_files)} files")
    for f in changed_files:
        print(f"  - {f.relative_to(abi_dir)}")

if __name__ == '__main__':
    main()
