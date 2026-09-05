---
"@tevm/zig": patch
---

Make exported modules build their Rust crypto archive before linking in downstream projects, including Guillotine Mini WASM. Run WASM archive filtering from Voltaire's root and include its script in the Zig package so dependency builds work from other working directories.
