/**
 * Create ChainHead from block data or RPC response
 *
 * @param {{ number: bigint | number | string; hash: import('../BlockHash/BlockHashType.js').BlockHashType | string; timestamp: bigint | number | string; difficulty?: bigint | number | string; totalDifficulty?: bigint | number | string }} value - Chain head data
 * @returns {import('./ChainHeadType.js').ChainHeadType} ChainHead
 *
 * @example
 * ```typescript
 * const head = ChainHead.from({
 *   number: 18000000n,
 *   hash: blockHash,
 *   timestamp: 1699000000n,
 * });
 * ```
 */
export function from(value) {
	if (!value || typeof value !== "object") {
		throw new Error("Invalid ChainHead input");
	}

	if (!value.number || !value.hash || value.timestamp === undefined) {
		throw new Error(
			"ChainHead requires number, hash, and timestamp properties",
		);
	}

	// Handle hash as string or bytes
	/** @type {import('../BlockHash/BlockHashType.js').BlockHashType} */
	let hash;
	if (typeof value.hash === "string") {
		// Convert hex string to bytes
		const hex = value.hash.startsWith("0x") ? value.hash.slice(2) : value.hash;
		if (hex.length !== 64) {
			throw new Error(`Invalid block hash length: ${hex.length}`);
		}
		const bytes = new Uint8Array(32);
		for (let i = 0; i < 32; i++) {
			bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
		}
		hash =
			/** @type {import('../BlockHash/BlockHashType.js').BlockHashType} */ (
				bytes
			);
	} else {
		hash = value.hash;
	}

	return /** @type {import('./ChainHeadType.js').ChainHeadType} */ ({
		number:
			/** @type {import('../BlockNumber/BlockNumberType.js').BlockNumberType} */ (
				BigInt(value.number)
			),
		hash: hash,
		timestamp: /** @type {import('../Uint/Uint256Type.js').Uint256Type} */ (
			BigInt(value.timestamp)
		),
		difficulty:
			value.difficulty !== undefined
				? /** @type {import('../Uint/Uint256Type.js').Uint256Type} */ (
						BigInt(value.difficulty)
					)
				: undefined,
		totalDifficulty:
			value.totalDifficulty !== undefined
				? /** @type {import('../Uint/Uint256Type.js').Uint256Type} */ (
						BigInt(value.totalDifficulty)
					)
				: undefined,
	});
}
