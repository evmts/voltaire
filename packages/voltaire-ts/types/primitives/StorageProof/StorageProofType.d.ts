import type { StorageKeyType } from "../State/StorageKeyType.js";
import type { StorageValueType } from "../StorageValue/StorageValueType.js";
/**
 * StorageProof represents an EIP-1186 storage proof for a single storage slot.
 *
 * Each storage proof demonstrates that a specific storage key-value pair exists
 * (or doesn't exist) in a contract's storage trie at a given block. The proof
 * consists of RLP-encoded Merkle Patricia Trie nodes forming a path from the
 * storage root to the leaf containing the value.
 *
 * Storage proofs are part of the StateProof structure and enable trustless
 * verification of contract storage without executing transactions or trusting
 * external data providers.
 *
 * @see EIP-1186: https://eips.ethereum.org/EIPS/eip-1186
 */
export type StorageProofType = {
    /**
     * The storage slot being proven.
     * Combines contract address and 256-bit slot number.
     */
    readonly key: StorageKeyType;
    /**
     * The value stored at this slot.
     * Zero if the slot is uninitialized or was cleared.
     */
    readonly value: StorageValueType;
    /**
     * Array of RLP-encoded Merkle Patricia Trie nodes.
     * Forms the path from the storage root hash to this storage slot.
     * Nodes are ordered from root to leaf.
     */
    readonly proof: readonly Uint8Array[];
};
/**
 * Inputs that can be converted to StorageProof
 */
export type StorageProofLike = StorageProofType | {
    key: StorageKeyType;
    value: StorageValueType;
    proof: readonly Uint8Array[];
};
//# sourceMappingURL=StorageProofType.d.ts.map