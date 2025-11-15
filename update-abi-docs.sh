#!/bin/bash
# Script to update ABI documentation to use data-first pattern

set -e  # Exit on error

ABI_DIR="/Users/williamcory/voltaire/docs/primitives/abi"

echo "Updating ABI documentation to use data-first pattern..."

# Find all .mdx files in the abi directory
find "$ABI_DIR" -name "*.mdx" -type f | while read -r file; do
    echo "Processing: $file"

    # Create a backup
    cp "$file" "$file.bak"

    # Apply transformations using perl for better regex support
    perl -i -pe '
        # Fix imports - Function
        s/import \{ Function \} from '\''@tevm\/voltaire'\''/import * as Abi from '\''@tevm\/voltaire\/Abi'\''/g;

        # Fix imports - Event
        s/import \{ Event \} from '\''@tevm\/voltaire'\''/import * as Abi from '\''@tevm\/voltaire\/Abi'\''/g;

        # Fix imports - AbiError
        s/import \{ AbiError \} from '\''@tevm\/voltaire'\''/import * as Abi from '\''@tevm\/voltaire\/Abi'\''/g;

        # Fix imports - Constructor
        s/import \{ Constructor \} from '\''@tevm\/voltaire'\''/import * as Abi from '\''@tevm\/voltaire\/Abi'\''/g;

        # Fix imports - Keccak256
        s/import \{ Keccak256 \} from '\''@tevm\/voltaire'\''/import * as Keccak256 from '\''@tevm\/voltaire\/Keccak256'\''/g;
    ' "$file"

    # Second pass - fix constructors (remove "new " prefix)
    perl -i -pe '
        s/new Function\s*\(/\{/g;
        s/new Event\s*\(/\{/g;
        s/new AbiError\s*\(/\{/g;
        s/new Constructor\s*\(/\{/g;
    ' "$file"

    # Third pass - add "as const" where constructors were closed
    # This is heuristic-based
    perl -i -pe '
        # Pattern: }) at end of line or before newline -> } as const
        s/\}\)(\s*$)/} as const$1/gm;
        s/\}\)(\s*\n)/} as const$1/g;
    ' "$file"
done

echo ""
echo "First-pass transformations complete!"
echo "Note: Method call transformations (e.g., fn.getSelector() -> Abi.Function.getSelector(fn))"
echo "need to be done manually or with a more sophisticated script."
echo ""
echo "Backup files created with .bak extension"
