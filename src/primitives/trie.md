# Merkle Patricia Trie

Ethereum's modified Merkle Patricia Trie data structure for state storage.

## Overview

The Merkle Patricia Trie (MPT) is Ethereum's core data structure for storing state, combining properties of Merkle trees and Patricia tries. It provides:
- O(log n) lookup, insert, and delete
- Cryptographic commitments via root hash
- Efficient proof generation
- Deterministic ordering

## Key Concepts

### Trie Nodes

Four node types:

1. **Empty Node** - `null` or empty
2. **Branch Node** - 17-element array (16 hex digits + value)
3. **Extension Node** - `[encodedPath, next]` (shared prefix optimization)
4. **Leaf Node** - `[encodedPath, value]` (terminal node)

### Hexary Encoding

Ethereum uses hex-prefix encoding for paths:
- Nibbles (4-bit values) represent path
- Compact encoding saves space
- Distinguishes leaf vs extension nodes

## Constants

```typescript
import { State } from '@tevm/voltaire';

// Empty trie root
const EMPTY_TRIE_ROOT = State.EMPTY_TRIE_ROOT;
// 0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421

// Empty code hash (keccak256(''))
const EMPTY_CODE_HASH = State.EMPTY_CODE_HASH;
// 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
```

## Use Cases

### State Trie

Maps account addresses to account state:
```
address → { nonce, balance, storageRoot, codeHash }
```

### Storage Trie

Each account has storage trie mapping slots to values:
```
storageKey → storageValue
```

### Transaction Trie

Block contains transaction trie:
```
transactionIndex → transactionData
```

### Receipt Trie

Block contains receipt trie:
```
transactionIndex → receiptData
```

## Storage Key Generation

```typescript
import { Keccak256 } from '@tevm/voltaire';

// Simple storage slot
function simpleStorageKey(slot: bigint): Uint8Array {
    const slotBytes = new Uint8Array(32);
    new DataView(slotBytes.buffer).setBigUint64(24, slot, false);
    return slotBytes;
}

// Mapping storage: mapping(address => uint256)
function mappingStorageKey(mapSlot: bigint, key: Address): Uint8Array {
    const data = new Uint8Array(52);
    data.set(key, 0);  // 20 bytes
    // Set slot at offset 20 (32 bytes)
    new DataView(data.buffer, 20).setBigUint64(24, mapSlot, false);

    return Keccak256.hash(data);
}

// Nested mapping: mapping(address => mapping(address => uint256))
function nestedMappingKey(
    outerSlot: bigint,
    outerKey: Address,
    innerKey: Address
): Uint8Array {
    // First level
    const firstHash = mappingStorageKey(outerSlot, outerKey);

    // Second level
    const data = new Uint8Array(52);
    data.set(innerKey, 0);
    data.set(firstHash, 20);

    return Keccak256.hash(data);
}
```

## Merkle Proof Verification

```typescript
import { Keccak256, Rlp } from '@tevm/voltaire';

function verifyMerkleProof(
    rootHash: Uint8Array,
    key: Uint8Array,
    proof: Uint8Array[],
    expectedValue: Uint8Array
): boolean {
    let currentHash = rootHash;
    let keyNibbles = bytesToNibbles(key);
    let keyOffset = 0;

    for (const nodeRlp of proof) {
        // Verify current hash matches
        const nodeHash = Keccak256.hash(nodeRlp);
        if (!hashesEqual(currentHash, nodeHash)) {
            return false;
        }

        // Decode node
        const node = Rlp.decode(nodeRlp);

        // Navigate trie based on node type
        // (Simplified - full implementation more complex)
        if (node.length === 17) {
            // Branch node
            const nibble = keyNibbles[keyOffset++];
            currentHash = node[nibble];
        } else if (node.length === 2) {
            // Extension or leaf
            const [path, value] = node;
            // ... navigate based on path
            currentHash = value;
        }
    }

    // Final value should match expected
    return valuesEqual(currentHash, expectedValue);
}

function bytesToNibbles(bytes: Uint8Array): number[] {
    const nibbles: number[] = [];
    for (const byte of bytes) {
        nibbles.push(byte >> 4);      // High nibble
        nibbles.push(byte & 0x0f);    // Low nibble
    }
    return nibbles;
}
```

## Implementation Status

**TypeScript:** Basic utilities (constants, storage key generation)
**Zig:** Full MPT implementation in progress

For production use, consider:
- [@ethereumjs/trie](https://github.com/ethereumjs/ethereumjs-monorepo/tree/master/packages/trie)
- [go-ethereum/trie](https://github.com/ethereum/go-ethereum/tree/master/trie)

## References

- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Appendix D (Modified Merkle Patricia Trie)
- [Ethereum Wiki: Patricia Tree](https://eth.wiki/fundamentals/patricia-tree)
- [Merkle Patricia Trie Specification](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/)
- [EIP-1186](https://eips.ethereum.org/EIPS/eip-1186) - eth_getProof RPC Method

## Testing

Basic test coverage in:
- `trie.test.ts` - Storage key generation
- `trie.zig` - Full MPT operations (56 test blocks)

## Security Notes

1. **Deterministic**: Same data always produces same root hash
2. **Collision Resistant**: Keccak-256 provides collision resistance
3. **Efficient Proofs**: O(log n) proof size
4. **No Reorgs**: Trie structure prevents reorganization attacks
