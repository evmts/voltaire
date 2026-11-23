---
"@tevm/voltaire": minor
---

Implement Osaka ModExp operand bounds and gas pricing in Zig and TypeScript.
Both TypeScript gas helpers accept an optional branded hardfork, defaulting to
Berlin for compatibility. The precompile dispatcher forwards the selected fork.
Export Zig's Osaka minimum gas and operand-length limit through the existing
ModExp module. Preserve historical pricing and right-padded input behavior,
and reject oversized operands before empty-output shortcuts.
