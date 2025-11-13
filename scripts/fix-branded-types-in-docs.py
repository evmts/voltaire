#!/usr/bin/env python3
"""
Fix documentation to use branded types instead of raw Uint8Arrays and .fromX methods
"""

import re
import os
from pathlib import Path

def fix_file(filepath):
    """Fix branded type usage in a single file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Skip if this is a documentation page about the method itself
    if 'title:' in content and ('fromHex' in content or 'fromString' in content):
        first_lines = '\n'.join(content.split('\n')[:10])
        if 'title: ' in first_lines and '.from' in first_lines:
            return content, False

    # Fix: new Uint8Array(N) -> BytesN() for common sizes
    size_map = {
        '1': 'Bytes1',
        '2': 'Bytes2',
        '3': 'Bytes3',
        '4': 'Bytes4',
        '5': 'Bytes5',
        '6': 'Bytes6',
        '7': 'Bytes7',
        '8': 'Bytes8',
        '16': 'Bytes16',
        '32': 'Bytes32',
        '64': 'Bytes64',
    }

    for size, type_name in size_map.items():
        content = re.sub(
            rf'new Uint8Array\({size}\)',
            f'{type_name}()',
            content
        )

    # Fix: Bytecode.fromHex(...) -> Bytecode(...) in code examples
    content = re.sub(
        r'Bytecode\.fromHex\(([^)]+)\)',
        r'Bytecode(\1)',
        content
    )

    # Fix: Hash.fromHex(...) -> Hash(...) in code examples
    content = re.sub(
        r'Hash\.fromHex\(([^)]+)\)',
        r'Hash(\1)',
        content
    )

    # Fix: Hardfork.fromString(...) -> Hardfork(...) in code examples
    content = re.sub(
        r'Hardfork\.fromString\(([^)]+)\)',
        r'Hardfork(\1)',
        content
    )

    # Fix: Opcode.fromHex(...) -> Opcode(...) in code examples
    content = re.sub(
        r'Opcode\.fromHex\(([^)]+)\)',
        r'Opcode(\1)',
        content
    )

    # Fix: Hex.fromString(...) -> Hex(...) in code examples
    content = re.sub(
        r'Hex\.fromString\(([^)]+)\)',
        r'Hex(\1)',
        content
    )

    # Fix salt:const salt = new Uint8Array(32); -> const salt = Bytes32();
    content = re.sub(
        r'const salt = new Uint8Array\(32\);',
        'const salt = Bytes32();',
        content
    )

    # Fix: new Uint8Array([/* bytecode */]) -> Bytecode()
    content = re.sub(
        r'new Uint8Array\(\[\s*/\*\s*bytecode\s*\*/\s*\]\)',
        'Bytecode()',
        content
    )

    # Fix: new Uint8Array([...bytes...]) in initCode context -> Bytecode([...])
    # This is trickier - look for initCode variable assignments
    content = re.sub(
        r'const initCode = new Uint8Array\(\[',
        'const initCode = Bytecode([',
        content
    )

    # Fix: new Uint8Array([]) -> Bytes()
    content = re.sub(
        r'new Uint8Array\(\[\]\)',
        'Bytes()',
        content
    )

    # Return True if changed
    return content, content != original

def main():
    docs_dir = Path('/Users/williamcory/voltaire/docs')

    files_changed = 0
    total_files = 0

    for mdx_file in docs_dir.rglob('*.mdx'):
        total_files += 1
        new_content, changed = fix_file(mdx_file)

        if changed:
            print(f"Fixing: {mdx_file.relative_to(docs_dir)}")
            with open(mdx_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            files_changed += 1

    print(f"\nProcessed {total_files} files, changed {files_changed}")

if __name__ == '__main__':
    main()
