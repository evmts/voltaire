import type { BlockNumberType } from "../BlockNumber/BlockNumberType.js";
import type { HashType } from "../Hash/HashType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";
/**
 * Bundle type
 *
 * Represents a transaction bundle for MEV (Maximal Extractable Value) strategies.
 * Bundles are atomic collections of transactions submitted to block builders via
 * MEV relays like Flashbots. All transactions in a bundle execute sequentially
 * in the same block or the bundle is discarded.
 *
 * @see https://voltaire.tevm.sh/primitives/bundle for Bundle documentation
 * @see https://docs.flashbots.net/flashbots-auction/overview for Flashbots Auction
 * @since 0.0.0
 */
export type BundleType = {
    /**
     * Ordered array of signed transaction bytes
     * All transactions execute sequentially in this order
     */
    readonly transactions: readonly Uint8Array[];
    /**
     * Target block number for bundle inclusion (optional)
     * If specified, bundle is only valid for this block
     */
    readonly blockNumber?: BlockNumberType;
    /**
     * Minimum block timestamp for bundle inclusion (optional)
     * Bundle will not be included before this timestamp
     */
    readonly minTimestamp?: Uint256Type;
    /**
     * Maximum block timestamp for bundle inclusion (optional)
     * Bundle will not be included after this timestamp
     */
    readonly maxTimestamp?: Uint256Type;
    /**
     * Transaction hashes allowed to revert (optional)
     * If any other transaction reverts, entire bundle is discarded
     * If a hash in this array reverts, bundle continues execution
     */
    readonly revertingTxHashes?: readonly HashType[];
};
/**
 * Inputs that can be converted to Bundle
 */
export type BundleLike = BundleType | {
    transactions: (Uint8Array | string)[];
    blockNumber?: BlockNumberType | bigint | number | string;
    minTimestamp?: Uint256Type | bigint | number | string;
    maxTimestamp?: Uint256Type | bigint | number | string;
    revertingTxHashes?: (HashType | string)[];
};
//# sourceMappingURL=BundleType.d.ts.map