#!/usr/bin/env python3
"""
Aggressively update all docs files at once to prevent reverts.
"""
import re
from pathlib import Path
import sys

def remove_deprecated_content(content: str) -> str:
    """Remove all deprecated API references."""
    original = content

    # Remove deprecated Tab components - be aggressive with regex
    deprecated_tab_patterns = [
        (r'<Tab title="Namespace API[^"]*">.*?</Tab>', ''),
        (r'<Tab title="Effect[^"]*">.*?</Tab>', ''),
        (r'<Tab title="Zig[^"]*">.*?</Tab>', ''),
        (r'<Tab title="C[^"]*API[^"]*">.*?</Tab>', ''),
        (r'<Tab title="Tree-shakeable[^"]*">.*?</Tab>', ''),
    ]

    for pattern, replacement in deprecated_tab_patterns:
        content = re.sub(pattern, replacement, content, flags=re.DOTALL | re.IGNORECASE)

    # Remove deprecated section headings and their content
    deprecated_sections = [
        r'## Namespace API.*?(?=##|\Z)',
        r'## Zig Implementation.*?(?=##|\Z)',
        r'## Effect\.ts.*?(?=##|\Z)',
        r'## Tree-Shakeable Usage.*?(?=##|\Z)',
    ]

    for pattern in deprecated_sections:
        content = re.sub(pattern, '', content, flags=re.DOTALL)

    # Clean up excessive whitespace
    content = re.sub(r'\n{3,}', '\n\n', content)

    return content

# Core files to update
core_updates = {
    'docs/mint.json': lambda c: c.replace(
        '"getting-started/effect",\n\t\t\t\t',
        ''
    ).replace(
        '"getting-started/tree-shaking",\n\t\t\t\t',
        ''
    ),

    'docs/introduction.mdx': lambda c: c.replace(
        '- **[Effect.ts Integration](/getting-started/effect)** - First-class Effect.ts APIs for functional, composable, and type-safe error handling.\n',
        ''
    ).replace(
        '- **[Zig-Wasm-Accelerated](/getting-started/wasm)** - High-performance WASM implementations built with Zig for cryptography and encoding.\n',
        '- **[WASM-Accelerated](/getting-started/wasm)** - High-performance WASM implementations for cryptography and encoding.\n'
    ).replace(
        '- **[Tree-Shakeable](/getting-started/tree-shaking)** - Import only what you need with unused code automatically excluded from bundles.\n',
        ''
    ).replace(
        '- **[Multiplatform](/getting-started/multiplatform)** - Works everywhere: TypeScript, Zig, and any language with C-FFI support.\n',
        '- **[Multiplatform](/getting-started/multiplatform)** - Works everywhere: TypeScript in Node.js, browsers, and any language with C-FFI support.\n'
    ),
}

# Apply updates
for file_path, update_func in core_updates.items():
    path = Path(file_path)
    if path.exists():
        content = path.read_text()
        new_content = update_func(content)
        if new_content != content:
            path.write_text(new_content)
            print(f"Updated: {file_path}")

# Update all MDX files
docs_dir = Path('docs')
for mdx_file in docs_dir.rglob('*.mdx'):
    try:
        content = mdx_file.read_text()
        new_content = remove_deprecated_content(content)
        if new_content != content:
            mdx_file.write_text(new_content)
            print(f"Updated: {mdx_file}")
    except Exception as e:
        print(f"Error updating {mdx_file}: {e}", file=sys.stderr)

print("\nAll updates complete!")
