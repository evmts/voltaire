import { from as blockHashFrom } from "../BlockHash/index.js";
import { from as uint256From } from "../Uint/index.js";

/**
 * Create Block from components
 *
 * @param {object} params - Block parameters
 * @param {import('../BlockHeader/BlockHeaderType.js').BlockHeaderType} params.header - Block header
 * @param {import('../BlockBody/BlockBodyType.js').BlockBodyType} params.body - Block body
 * @param {import('../BlockHash/BlockHashType.js').BlockHashType | string} params.hash - Block hash
 * @param {bigint | number | string} params.size - Block size in bytes
 * @param {bigint | number | string} [params.totalDifficulty] - Total difficulty (optional, pre-merge)
 * @returns {import('./BlockType.js').BlockType} Block
 *
 * @example
 * ```typescript
 * const block = Block.from({
 *   header: blockHeader,
 *   body: blockBody,
 *   hash: "0x1234...",
 *   size: 1024n,
 *   totalDifficulty: 12345678n // Optional, pre-merge
 * });
 * ```
 */
export function from({ header, body, hash, size, totalDifficulty }) {
	/** @type {import('./BlockType.js').BlockType} */
	const block = {
		header,
		body,
		hash: blockHashFrom(hash),
		size: uint256From(size),
		totalDifficulty:
			totalDifficulty !== undefined ? uint256From(totalDifficulty) : undefined,
	};

	return block;
}
