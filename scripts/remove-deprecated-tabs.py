#!/usr/bin/env python3
"""
Remove deprecated API tabs from Voltaire documentation.
Removes: Namespace API, Effect Schema, Effect.ts, Zig, C, Tree-shakeable tabs
Keeps: Class API, TypeScript tabs (and converts them to just code blocks when alone)
"""

import re
import sys
from pathlib import Path

def remove_tabs_from_content(content: str) -> tuple[str, bool]:
    """
    Remove deprecated tabs from MDX content.
    Returns (modified_content, was_modified)
    """
    original = content
    modified = False

    # Patterns for tabs to remove
    remove_patterns = [
        r'<Tab title="Namespace API">.*?</Tab>',
        r'<Tab title="Effect Schema">.*?</Tab>',
        r'<Tab title="Effect\.ts">.*?</Tab>',
        r'<Tab title="Zig">.*?</Tab>',
        r'<Tab title="C">.*?</Tab>',
        r'<Tab title="C API">.*?</Tab>',
        r'<Tab title="Tree-shakeable">.*?</Tab>',
    ]

    # Remove each deprecated tab type
    for pattern in remove_patterns:
        before = content
        content = re.sub(pattern, '', content, flags=re.DOTALL)
        if content != before:
            modified = True

    # Now handle <Tabs> blocks
    # If only one tab remains (Class API or TypeScript), unwrap it
    def process_tabs_block(match):
        nonlocal modified
        tabs_content = match.group(0)

        # Count remaining tabs
        tab_count = len(re.findall(r'<Tab title=', tabs_content))

        if tab_count == 0:
            # No tabs left, remove entire Tabs block
            modified = True
            return ''
        elif tab_count == 1:
            # Only one tab left - unwrap it
            # Extract the tab content
            tab_match = re.search(r'<Tab title="([^"]+)">(.*?)</Tab>', tabs_content, re.DOTALL)
            if tab_match:
                modified = True
                tab_content = tab_match.group(2).strip()
                return f'\n{tab_content}\n'
            return tabs_content
        else:
            # Multiple tabs remain - keep the structure
            return tabs_content

    # Process all <Tabs>...</Tabs> blocks
    content = re.sub(
        r'<Tabs>.*?</Tabs>',
        process_tabs_block,
        content,
        flags=re.DOTALL
    )

    # Clean up excessive newlines (more than 2 consecutive)
    content = re.sub(r'\n{3,}', '\n\n', content)

    return (content, modified or (content != original))

def process_file(file_path: Path, dry_run: bool = False) -> bool:
    """Process a single MDX file. Returns True if modified."""
    try:
        content = file_path.read_text(encoding='utf-8')
        new_content, was_modified = remove_tabs_from_content(content)

        if was_modified:
            if not dry_run:
                file_path.write_text(new_content, encoding='utf-8')
            print(f"{'[DRY RUN] ' if dry_run else ''}Modified: {file_path}")
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}", file=sys.stderr)
        return False

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Remove deprecated API tabs from MDX files')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be changed without modifying files')
    parser.add_argument('path', nargs='?', default='docs', help='Path to docs directory or specific file')
    args = parser.parse_args()

    path = Path(args.path)

    if path.is_file():
        files = [path]
    else:
        files = list(path.rglob('*.mdx'))

    modified_count = 0
    for file_path in files:
        if process_file(file_path, args.dry_run):
            modified_count += 1

    print(f"\n{'[DRY RUN] ' if args.dry_run else ''}Total files modified: {modified_count}/{len(files)}")

if __name__ == '__main__':
    main()
