import type { WeiType } from "../Denomination/WeiType.js";
import type { HashType } from "../Hash/HashType.js";
import type { NonceType } from "../Nonce/NonceType.js";
import type { StateRootType } from "../StateRoot/StateRootType.js";
/**
 * AccountState represents the state of an Ethereum account as defined in the Yellow Paper.
 *
 * Each account in Ethereum has four fields:
 * - nonce: Number of transactions sent from this address (for EOAs) or contracts created (for contracts)
 * - balance: Amount of Wei owned by this account
 * - storageRoot: Root hash of the account's storage trie (for contracts) or empty hash (for EOAs)
 * - codeHash: Hash of the account's EVM bytecode (for contracts) or hash of empty string (for EOAs)
 *
 * The global state is a mapping from addresses to account states, represented as a
 * Merkle Patricia Trie. The root of this trie is the state root included in each block header.
 *
 * @see Yellow Paper section 4.1 - World State
 */
export type AccountStateType = {
    /**
     * Transaction count (EOA) or number of contract creations (contract account).
     * Starts at 0 and increments with each transaction/creation.
     */
    readonly nonce: NonceType;
    /**
     * Account balance in Wei (10^-18 ETH).
     * Can be zero or any positive value up to the total ETH supply.
     */
    readonly balance: WeiType;
    /**
     * Root hash of the account's storage trie.
     * For EOAs (externally owned accounts), this is the empty trie hash.
     * For contracts, this is the root of the Merkle Patricia Trie containing storage slots.
     */
    readonly storageRoot: StateRootType;
    /**
     * Keccak256 hash of the account's EVM bytecode.
     * For EOAs, this is keccak256("") = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470.
     * For contracts, this is the hash of their deployed bytecode.
     */
    readonly codeHash: HashType;
};
/**
 * Inputs that can be converted to AccountState
 */
export type AccountStateLike = AccountStateType | {
    nonce: NonceType;
    balance: WeiType;
    storageRoot: StateRootType;
    codeHash: HashType;
};
/**
 * Standard hash of empty string - used for EOA code hash
 * keccak256("") = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
 */
export declare const EMPTY_CODE_HASH = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";
/**
 * Standard hash of empty trie - used for EOA storage root
 * keccak256(rlp([])) = 0x56e81f171bcc55a6ff8345e692c0f86e5b47e5b60e2d8c5ab6c7c9fa0e32d3c5
 */
export declare const EMPTY_TRIE_HASH = "0x56e81f171bcc55a6ff8345e692c0f86e5b47e5b60e2d8c5ab6c7c9fa0e32d3c5";
//# sourceMappingURL=AccountStateType.d.ts.map