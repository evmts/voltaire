# Merkle Patricia Trie

A complete TypeScript implementation of Ethereum's Modified Merkle Patricia Trie (MPT) as specified in the Yellow Paper (Appendix D).

## Features

- **Complete CRUD Operations**: get, put, delete with efficient path compression
- **Merkle Proofs**: Generate and verify cryptographic proofs of inclusion/exclusion
- **Checkpoints**: Transaction-like commit/revert functionality for state management
- **Deterministic**: Same operations always produce the same root hash
- **RLP Encoding**: Full Ethereum-compatible serialization
- **Pure TypeScript**: No FFI overhead, fully tree-shakable

## Architecture Decision

This implementation uses **Pure TypeScript** rather than FFI bindings to the Zig implementation.

### Rationale

1. **Completeness**: The Zig implementation lacks proof generation/verification
2. **Maintainability**: Pure TS is easier to debug and understand for JS developers
3. **Tree-shakability**: Better dead code elimination for bundlers
4. **Integration**: Direct use of existing primitives (RLP, Keccak-256)
5. **Performance**: MPT operations are not hot path; complexity overhead > FFI benefits
6. **Cross-platform**: Works everywhere TypeScript runs

## Node Types

The trie uses four node types:

1. **Null Node**: Empty trie (no data)
2. **Leaf Node**: Terminal node storing `[encodedPath, value]`
3. **Extension Node**: Path compression for shared prefixes `[encodedPath, childHash]`
4. **Branch Node**: 16 children (one per nibble) + optional value `[child0...child15, value]`

### Path Encoding (Hex Prefix)

Paths are encoded with a hex prefix indicating node type and parity:

- `0x00`: Even extension
- `0x1X`: Odd extension (X = first nibble)
- `0x20`: Even leaf
- `0x3X`: Odd leaf (X = first nibble)

## Usage

### Basic Operations

```typescript
import { create } from '@tevm/primitives/trie';

// Create a new trie
const trie = await create();

// Insert key-value pairs
await trie.put(
  new Uint8Array([0x12, 0x34]),
  new Uint8Array([0xab, 0xcd])
);

// Retrieve values
const value = await trie.get(new Uint8Array([0x12, 0x34]));
console.log(value); // Uint8Array([0xab, 0xcd])

// Delete keys
await trie.del(new Uint8Array([0x12, 0x34]));

// Get root hash for verification
const root = trie.root; // Uint8Array(32) | null
```

### Merkle Proofs

```typescript
// Generate a proof
const key = new Uint8Array([0x12, 0x34]);
const proof = await trie.createProof(key);

// Verify the proof
const root = trie.root;
const verified = await trie.verifyProof(root, key, proof);
console.log(verified); // Uint8Array([0xab, 0xcd]) or null
```

### Checkpoints and Revert

```typescript
// Create trie with checkpoints enabled
const trie = await create({ useCheckpoints: true });

await trie.put(new Uint8Array([0x01]), new Uint8Array([0xaa]));
const root1 = trie.root;

// Create checkpoint
trie.checkpoint();

// Make changes
await trie.put(new Uint8Array([0x02]), new Uint8Array([0xbb]));
const root2 = trie.root;

// Revert to checkpoint
trie.revert();

console.log(trie.root === root1); // true
```

### Custom Database

```typescript
import { create } from '@tevm/primitives/trie';
import type { TrieDB } from '@tevm/primitives/trie';

class MyDB implements TrieDB {
  async get(key: Bytes): Promise<Bytes | null> {
    // Your implementation
  }

  async put(key: Bytes, value: Bytes): Promise<void> {
    // Your implementation
  }

  async del(key: Bytes): Promise<void> {
    // Your implementation
  }

  async batch(ops): Promise<void> {
    // Your implementation
  }
}

const trie = await create({ db: new MyDB() });
```

## Implementation Details

### Node Hashing

Nodes are hashed using Keccak-256:
- **Embedded nodes** (< 32 bytes): Stored inline, no hash
- **Standard nodes** (≥ 32 bytes): Hashed and stored in database

This optimization reduces storage and improves performance for small subtrees.

### Path Compression

The trie uses extension nodes to compress shared path prefixes:

```
Without extension:      With extension:
    branch                 extension[1,2,3]
    /                           |
   1                          branch
  /                           /  \
 2                           4    5
/
3
 \
  branch
  /  \
 4    5
```

### Database Keys

Node hashes are used as database keys. For embedded nodes (< 32 bytes), the node itself is used as the reference rather than storing in the database.

## Performance

### Time Complexity

- **Get**: O(log n) average, O(n) worst case
- **Put**: O(log n) average, O(n) worst case
- **Delete**: O(log n) average, O(n) worst case
- **Proof Generation**: O(log n)
- **Proof Verification**: O(log n)

where n is the number of keys.

### Space Complexity

- **Storage**: O(n) for n keys
- **Path compression** reduces storage significantly for sparse tries
- **Embedded nodes** (< 32 bytes) save storage and lookups

## Testing

The implementation includes comprehensive tests:

- ✅ Basic CRUD operations
- ✅ All node types (leaf, extension, branch)
- ✅ Root hash determinism
- ✅ Merkle proof generation and verification
- ✅ Edge cases (empty keys, large values, single byte keys)
- ✅ Large datasets (100+ entries)
- ✅ Checkpoint/revert functionality
- ✅ Ethereum test vectors

Run tests:

```bash
bun test src/primitives/trie/trie.test.ts
```

## Ethereum Compatibility

This implementation follows the Ethereum Yellow Paper specification exactly:

- **RLP Encoding**: Nodes are RLP-encoded per Yellow Paper Appendix D
- **Keccak-256**: Uses correct Keccak-256 (pre-NIST), not SHA3
- **Hex Prefix**: Implements Yellow Paper Appendix C encoding
- **Node Structure**: Matches Ethereum's node format exactly

## Security Considerations

### Cryptographic Properties

- **Collision Resistance**: Keccak-256 provides 128-bit collision resistance
- **Proof Soundness**: Proofs are cryptographically sound; cannot forge inclusion
- **Determinism**: Same data always produces same root hash

### Input Validation

The implementation validates:
- All node structures during decoding
- Proof consistency during verification
- Path encoding correctness
- RLP structure and canonicality

## Limitations

1. **In-Memory Only**: Default database is memory-only; use custom DB for persistence
2. **No Pruning**: Old nodes are not automatically garbage collected
3. **No Caching**: Each node lookup queries the database (can be added to custom DB)
4. **Async Only**: All operations are async (required for DB interface)

## Future Enhancements

Potential improvements:

- [ ] **Pruning**: Automatic garbage collection of orphaned nodes
- [ ] **Caching**: LRU cache for frequently accessed nodes
- [ ] **Batch Operations**: Batch multiple puts/deletes
- [ ] **Witnesses**: Generate and verify state witnesses
- [ ] **Parallel Proof Verification**: Verify multiple proofs concurrently
- [ ] **Compressed Proofs**: Proof compression for bandwidth efficiency

## References

- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Appendix D
- [Ethereum Patricia Tree](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/)
- [RLP Encoding](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/)
- [Ethereum Wiki - Patricia Tree](https://eth.wiki/fundamentals/patricia-tree)

## License

MIT
