import type { BlockNumberType } from "../BlockNumber/BlockNumberType.js";
import type { BlockHashType } from "../BlockHash/BlockHashType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";

/**
 * Current chain head information
 *
 * Represents the latest block at the tip of the blockchain.
 * Typically obtained from eth_getBlockByNumber("latest").
 *
 * @example
 * ```typescript
 * const chainHead: ChainHeadType = {
 *   number: 18000000n,
 *   hash: blockHash,
 *   timestamp: 1699000000n,
 *   difficulty: 0n, // Post-merge (PoS)
 *   totalDifficulty: 58750003716598352816469n, // Pre-merge cumulative
 * };
 * ```
 */
export type ChainHeadType = {
	/**
	 * Block number
	 */
	readonly number: BlockNumberType;

	/**
	 * Block hash
	 */
	readonly hash: BlockHashType;

	/**
	 * Block timestamp (Unix seconds)
	 */
	readonly timestamp: Uint256Type;

	/**
	 * Block difficulty (0 post-merge)
	 */
	readonly difficulty?: Uint256Type;

	/**
	 * Total difficulty from genesis to this block
	 */
	readonly totalDifficulty?: Uint256Type;
};
