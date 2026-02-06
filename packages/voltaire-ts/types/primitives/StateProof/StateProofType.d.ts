import type { AddressType } from "../Address/AddressType.js";
import type { WeiType } from "../Denomination/WeiType.js";
import type { HashType } from "../Hash/HashType.js";
import type { NonceType } from "../Nonce/NonceType.js";
import type { StateRootType } from "../StateRoot/StateRootType.js";
import type { StorageProofType } from "../StorageProof/StorageProofType.js";
/**
 * StateProof represents an EIP-1186 account proof with storage proofs.
 *
 * EIP-1186 defines a standard for providing Merkle proofs of account state and
 * storage values. This enables light clients and trustless systems to verify
 * account data without executing transactions or trusting external providers.
 *
 * The proof structure includes:
 * - Account proof: RLP-encoded Merkle Patricia Trie nodes from state root to account
 * - Account fields: nonce, balance, codeHash, storageHash from the proven block
 * - Storage proofs: Optional array of proofs for specific storage slots
 *
 * Verification process:
 * 1. Verify account proof against known state root
 * 2. Reconstruct account state from proof
 * 3. Verify each storage proof against account's storage root
 *
 * @see EIP-1186: https://eips.ethereum.org/EIPS/eip-1186
 * @see JSON-RPC eth_getProof method
 */
export type StateProofType = {
    /**
     * The address of the account being proven.
     */
    readonly address: AddressType;
    /**
     * Array of RLP-encoded Merkle Patricia Trie nodes.
     * Forms the path from the state root to this account's leaf node.
     * Nodes are ordered from root to leaf.
     */
    readonly accountProof: readonly Uint8Array[];
    /**
     * Account balance in Wei at the proven block.
     */
    readonly balance: WeiType;
    /**
     * Keccak256 hash of the account's bytecode.
     * For EOAs, this is the empty code hash.
     */
    readonly codeHash: HashType;
    /**
     * Transaction count (EOA) or contract creation count.
     */
    readonly nonce: NonceType;
    /**
     * Root hash of the account's storage trie.
     * Storage proofs must verify against this root.
     */
    readonly storageHash: StateRootType;
    /**
     * Array of proofs for specific storage slots.
     * Each proof demonstrates a key-value pair in the account's storage.
     */
    readonly storageProof: readonly StorageProofType[];
};
/**
 * Inputs that can be converted to StateProof
 */
export type StateProofLike = StateProofType | {
    address: AddressType;
    accountProof: readonly Uint8Array[];
    balance: WeiType;
    codeHash: HashType;
    nonce: NonceType;
    storageHash: StateRootType;
    storageProof: readonly StorageProofType[];
};
//# sourceMappingURL=StateProofType.d.ts.map