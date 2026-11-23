---
"@tevm/voltaire": patch
---

Fix ABI decoding of fixed-size arrays and `BinaryTree` lookups below internal nodes.

- `Abi.decodeParameters` now advances past static fixed-size arrays by their full static size, so parameters after `uint256[2][3]` or a static `tuple[N]` decode from the correct offset (#72).
- `tuple[N]` whose tuple has a dynamic component (for example `(uint256,string)[2]`) is now treated as dynamic and decoded through its offset word (#72).
- `BinaryTree` internal nodes now keep their child subtrees (`leftChild`/`rightChild`) next to the cached child hashes. `BinaryTree.get` walks internal nodes instead of returning `null`, and `BinaryTree.insert` adds keys below an existing internal node instead of throwing. A hash-only (pruned) child with a non-zero hash throws `InvalidTreeStateError`; root hashes are unchanged (#58).
