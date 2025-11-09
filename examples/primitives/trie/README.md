# Merkle Patricia Trie Examples

Comprehensive examples demonstrating the Merkle Patricia Trie implementation.

## Overview

The Merkle Patricia Trie is Ethereum's core data structure for cryptographically secure state storage. These examples demonstrate both basic operations and real-world use cases.

## Examples

### Basic Operations

**Files**: `basic-operations.zig`, `basic-operations.ts`

Fundamental insert, get, delete operations. Start here to understand:
- Creating a trie
- Inserting key-value pairs
- Retrieving values
- Updating existing keys
- Deleting entries
- Root hash computation

**Run**:
```bash
zig build-exe examples/primitives/trie/basic-operations.zig --dep primitives -Mprimitives=src/primitives/root.zig
./basic-operations
```

### State Root

**Files**: `state-root.zig`, `state-root.ts`

Compute Ethereum state root from account states. Demonstrates:
- Account state encoding (nonce, balance, storage root, code hash)
- Building global state trie
- State root as cryptographic commitment
- How state changes affect root hash

**Key Concepts**:
- Each Ethereum account (address) maps to RLP-encoded state
- State root stored in block header
- Any account change → different state root

**Run**:
```bash
zig build-exe examples/primitives/trie/state-root.zig --dep primitives --dep crypto -Mprimitives=src/primitives/root.zig -Mcrypto=src/crypto/root.zig
./state-root
```

### Storage Trie

**Files**: `storage-trie.zig`, `storage-trie.ts`

Build contract storage trie (ERC20 token example). Shows:
- Simple storage slots (owner, totalSupply)
- Mapping storage keys (balances[address])
- Nested mapping storage keys (allowances[owner][spender])
- Storage root computation
- Keccak256-based storage key derivation

**Key Concepts**:
- Each contract has separate storage trie
- Storage root stored in account state
- Solidity mappings use Keccak256(key || slot)

**Run**:
```bash
zig build-exe examples/primitives/trie/storage-trie.zig --dep primitives --dep crypto -Mprimitives=src/primitives/root.zig -Mcrypto=src/crypto/root.zig
./storage-trie
```

### Transaction Trie

**Files**: `transaction-trie.zig`, `transaction-trie.ts`

Build transaction trie for a block. Demonstrates:
- Transaction encoding
- Index-based key encoding
- Building ordered transaction list
- Transaction root computation

**Key Concepts**:
- Each block has transaction trie
- Transactions ordered by index
- Transaction root in block header
- Enables Merkle proofs for tx inclusion

**Run**:
```bash
zig build-exe examples/primitives/trie/transaction-trie.zig --dep primitives --dep crypto -Mprimitives=src/primitives/root.zig -Mcrypto=src/crypto/root.zig
./transaction-trie
```

### Path Compression

**Files**: `path-compression.zig`, `path-compression.ts`

How trie optimizes storage with extension nodes. Shows:
- Long common prefixes → extension nodes
- Key is prefix of another → branch with value
- Gradual divergence → dynamic restructuring
- No common prefix → direct branch

**Key Concepts**:
- Extension nodes compress shared prefixes
- Branch nodes handle 16-way splits (one per nibble)
- Trie structure adapts to key distribution
- Optimal for sparse key spaces

**Run**:
```bash
zig build-exe examples/primitives/trie/path-compression.zig --dep primitives --dep crypto -Mprimitives=src/primitives/root.zig -Mcrypto=src/crypto/root.zig
./path-compression
```

### Root Determinism

**Files**: `root-determinism.zig`

Prove root hash is deterministic. Demonstrates:
- Same data → same root (regardless of insertion order)
- Different data → different root
- Delete + reinsert → original root
- Cryptographic commitment properties

**Key Concepts**:
- Insertion order doesn't matter
- Root hash uniquely identifies trie contents
- Determinism critical for consensus

**Run**:
```bash
zig build-exe examples/primitives/trie/root-determinism.zig --dep primitives --dep crypto -Mprimitives=src/primitives/root.zig -Mcrypto=src/crypto/root.zig
./root-determinism
```

### Clear and Reuse

**Files**: `clear-and-reuse.zig`

Efficient trie reuse pattern. Shows:
- `clear()` resets trie to empty
- Reusing same instance for multiple computations
- Batch processing pattern
- Memory efficiency benefits

**Use Cases**:
- Per-block trie computation
- Temporary state calculations
- Batch processing pipelines
- Testing scenarios

**Run**:
```bash
zig build-exe examples/primitives/trie/clear-and-reuse.zig --dep primitives --dep crypto -Mprimitives=src/primitives/root.zig -Mcrypto=src/crypto/root.zig
./clear-and-reuse
```

### Edge Cases

**Files**: `edge-cases.zig`

Boundary condition handling. Covers:
- Empty keys and values
- Single-byte keys
- Large keys (256 bytes) and values (4KB+)
- All-zeros and all-ones keys
- Overwriting with different lengths
- Delete non-existent keys
- Keys diverging at each nibble

**Run**:
```bash
zig build-exe examples/primitives/trie/edge-cases.zig --dep primitives --dep crypto -Mprimitives=src/primitives/root.zig -Mcrypto=src/crypto/root.zig
./edge-cases
```

## Architecture

### Node Types

1. **Empty**: Null/empty trie (no storage)
2. **Leaf**: Terminal node with value
3. **Extension**: Path compression for shared prefixes
4. **Branch**: Up to 16 children (one per nibble) + optional value

### Key Design

- Keys split into nibbles (4-bit values)
- Hex prefix encoding for paths
- RLP encoding for node serialization
- Keccak256 hashing for node digests

### Memory Model

- Node storage: HashMap keyed by hash
- Root hash: 32-byte Keccak256 digest
- Allocator-based memory management
- Explicit deallocation (no GC)

## Common Patterns

### State Management
```zig
var state_trie = Trie.init(allocator);
defer state_trie.deinit();

try state_trie.put(address, account_state);
const root = state_trie.root_hash();
```

### Batch Processing
```zig
var trie = Trie.init(allocator);
defer trie.deinit();

for (batches) |batch| {
    for (batch) |entry| {
        try trie.put(entry.key, entry.value);
    }
    const root = trie.root_hash();
    trie.clear(); // Reuse for next batch
}
```

### Verification
```zig
const val1 = try trie.get(key1);
const val2 = try trie.get(key2);

const root = trie.root_hash();
// Root commits to all data
```

## TypeScript Examples

TypeScript examples (`.ts` files) demonstrate the **intended API** once Trie is exposed via FFI. Currently, Trie is implemented in Zig only.

The examples show:
- Expected TypeScript interface
- Uint8Array-based keys/values
- Async/sync API design
- Integration patterns

## Performance

Benchmarks (Zig 0.15.1, ReleaseFast):

**Native**:
- Insert: ~1-2 μs per key
- Lookup: ~500-800 ns per key
- Delete: ~1-2 μs per key
- Root hash: ~10-50 μs (size-dependent)

**WASM**:
- Insert: ~3-5 μs per key
- Lookup: ~1-2 μs per key
- Delete: ~3-5 μs per key

## Use Cases

### Ethereum Applications
- **State Trie**: Global account state
- **Storage Trie**: Per-contract storage
- **Transaction Trie**: Block transactions
- **Receipt Trie**: Transaction receipts

### General Applications
- Cryptographically verified databases
- Merkle proof generation
- State snapshots
- Audit trails
- Version control

## Related Documentation

- **[Main Documentation](/src/content/docs/primitives/trie/)**: Comprehensive guide
- **[Operations](/src/content/docs/primitives/trie/operations.mdx)**: API reference
- **[Constructors](/src/content/docs/primitives/trie/constructors.mdx)**: Initialization
- **[Proof Generation](/src/content/docs/primitives/trie/proof-generation.mdx)**: Merkle proofs
- **[Verification](/src/content/docs/primitives/trie/verification.mdx)**: Proof verification

## Testing

Run trie tests:
```bash
zig build test -Dtest-filter=trie
```

## Implementation

Source: `src/primitives/trie.zig`

Core features:
- Modified Merkle Patricia Trie (Ethereum Yellow Paper Appendix D)
- RLP encoding for nodes
- Keccak256 hashing
- Path compression
- Branch node optimization
- Memory-efficient storage

## References

- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Appendix D
- [Patricia Trie](https://en.wikipedia.org/wiki/Radix_tree) - Radix tree structure
- [Merkle Tree](https://en.wikipedia.org/wiki/Merkle_tree) - Cryptographic hash tree
- [EIP-161](https://eips.ethereum.org/EIPS/eip-161) - State trie clearing
