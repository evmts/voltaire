/**
 * @fileoverview Pure function to convert full block to light block.
 *
 * @module toLightBlock
 * @since 0.3.0
 */

import type { LightBlock } from "@tevm/voltaire/block";

/**
 * Convert a full block to a lightweight block for reorg tracking.
 *
 * This is a pure function (no Effect wrapper needed) that extracts
 * only the essential fields for chain state tracking.
 *
 * @since 0.3.0
 *
 * @example
 * ```typescript
 * import * as Block from 'voltaire-effect/block'
 *
 * const light = Block.toLightBlock(fullBlock)
 * // { number: 18000000n, hash: '0x...', parentHash: '0x...', timestamp: 1695000000n }
 * ```
 */
export const toLightBlock = (block: unknown): LightBlock => {
	const b = block as Record<string, unknown>;
	const header = b.header as Record<string, unknown> | undefined;

	return {
		number:
			typeof (header?.number ?? b.number) === "bigint"
				? ((header?.number ?? b.number) as bigint)
				: BigInt((header?.number ?? b.number) as string | number),
		hash: b.hash as LightBlock["hash"],
		parentHash: (header?.parentHash ??
			b.parentHash) as LightBlock["parentHash"],
		timestamp:
			typeof (header?.timestamp ?? b.timestamp) === "bigint"
				? ((header?.timestamp ?? b.timestamp) as bigint)
				: BigInt((header?.timestamp ?? b.timestamp) as string | number),
	};
};
