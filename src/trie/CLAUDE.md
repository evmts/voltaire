# CLAUDE.md - Trie Module AI Context

## MISSION CRITICAL: Merkle Patricia Trie Implementation

The trie module implements Ethereum's Merkle Patricia Trie for state commitment. **ANY bug in trie operations can corrupt state roots and cause consensus failures.** Trie operations must maintain cryptographic security and deterministic results.

## Critical Implementation Details

### Merkle Patricia Trie Structure
- **State Root**: Cryptographic commitment to entire world state
- **Storage Root**: Per-account storage commitment
- **Transaction Root**: Commitment to all transactions in block
- **Receipt Root**: Commitment to all transaction receipts

### Key Responsibilities
- **Node Encoding**: RLP encoding/decoding of trie nodes
- **Path Compression**: Efficient storage of sparse tries
- **Hash Computation**: Keccak-256 hashing of trie nodes
- **Proof Generation**: Merkle proofs for state verification
- **Cache Management**: Efficient node caching and persistence

### Critical Operations
```zig
// Trie insert must maintain deterministic structure
pub fn insert(trie: *Trie, key: []const u8, value: []const u8) !void {
    const encoded_key = encode_path(key);
    const node = try trie.root.insert(encoded_key, value);
    trie.root = node;
    trie.hash_cache.clear(); // Invalidate cached hashes
}

// Hash computation must be deterministic and secure
pub fn compute_root_hash(trie: *const Trie) [32]u8 {
    return trie.root.compute_hash();
}
```

### Node Types (EIP-838)
- **Branch Node**: 16 children + optional value
- **Extension Node**: Path compression for common prefixes
- **Leaf Node**: Terminal node containing value
- **Empty Node**: Represents null/empty state

### Critical Safety Requirements
- All trie operations must be deterministic
- Hash computation must use Keccak-256 consistently
- Node encoding must follow RLP specification exactly
- Path encoding must handle nibble alignment correctly
- Trie structure must remain balanced and canonical

### Performance Optimization
- Lazy hash computation with caching
- Node deduplication for identical subtries
- Efficient path compression algorithms
- Memory pooling for temporary node objects
- Database batching for node persistence

### Security Considerations
- Prevent hash collision attacks through validation
- Ensure deterministic ordering of branch children
- Validate all input keys and values
- Protect against malformed trie data
- Implement secure deletion of sensitive data

### Testing Requirements
- Test all node type combinations
- Validate against official Ethereum test vectors
- Property-based testing for trie invariants
- Performance testing with large state trees
- Fuzzing with malformed input data

### Emergency Procedures
- State corruption detection and recovery
- Trie consistency validation
- Hash mismatch investigation
- Database corruption handling
- Safe recovery from invalid trie states

Remember: **The trie is the backbone of Ethereum's state security.** Any corruption or inconsistency in trie operations can compromise the cryptographic security of the entire blockchain state.