import type { AddressType } from "../Address/AddressType.js";
import type { BlockHashType } from "../BlockHash/BlockHashType.js";
import type { BlockNumberType } from "../BlockNumber/BlockNumberType.js";
import type { HashType } from "../Hash/HashType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";
/**
 * BlockHeader type - represents Ethereum block header
 *
 * Contains all metadata and Merkle roots for a block.
 * Used for block validation and light client proofs.
 *
 * @see https://voltaire.tevm.sh/primitives/block-header for BlockHeader documentation
 * @see https://ethereum.org/en/developers/docs/blocks/ for block documentation
 * @since 0.0.0
 */
export type BlockHeaderType = {
    /** Hash of parent block */
    readonly parentHash: BlockHashType;
    /** Keccak256 hash of ommers/uncles list RLP */
    readonly ommersHash: HashType;
    /** Address receiving block reward (miner/validator) */
    readonly beneficiary: AddressType;
    /** State trie root after block execution */
    readonly stateRoot: HashType;
    /** Transactions trie root */
    readonly transactionsRoot: HashType;
    /** Receipts trie root */
    readonly receiptsRoot: HashType;
    /** Bloom filter for logs (256 bytes) */
    readonly logsBloom: Uint8Array;
    /** Proof-of-work difficulty (0 post-merge) */
    readonly difficulty: Uint256Type;
    /** Block number */
    readonly number: BlockNumberType;
    /** Maximum gas allowed in block */
    readonly gasLimit: Uint256Type;
    /** Total gas used by transactions */
    readonly gasUsed: Uint256Type;
    /** Unix timestamp (seconds) */
    readonly timestamp: Uint256Type;
    /** Arbitrary data (max 32 bytes) */
    readonly extraData: Uint8Array;
    /** PoW mix hash (0 post-merge) */
    readonly mixHash: HashType;
    /** PoW nonce (8 bytes, 0 post-merge) */
    readonly nonce: Uint8Array;
    /** EIP-1559: Base fee per gas (post-London) */
    readonly baseFeePerGas?: Uint256Type;
    /** Post-merge: Withdrawals trie root (post-Shanghai) */
    readonly withdrawalsRoot?: HashType;
    /** EIP-4844: Total blob gas used (post-Cancun) */
    readonly blobGasUsed?: Uint256Type;
    /** EIP-4844: Excess blob gas (post-Cancun) */
    readonly excessBlobGas?: Uint256Type;
    /** EIP-4788: Parent beacon block root (post-Cancun) */
    readonly parentBeaconBlockRoot?: HashType;
};
//# sourceMappingURL=BlockHeaderType.d.ts.map