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
	let hash = value.hash;
	if (typeof hash === "string") {
		// Convert hex string to bytes
		const hex = hash.startsWith("0x") ? hash.slice(2) : hash;
		if (hex.length !== 64) {
			throw new Error(`Invalid block hash length: ${hex.length}`);
		}
		const bytes = new Uint8Array(32);
		for (let i = 0; i < 32; i++) {
			bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
		}
		hash = bytes;
	}

	return {
		number: BigInt(value.number),
		hash: hash,
		timestamp: BigInt(value.timestamp),
		difficulty:
			value.difficulty !== undefined ? BigInt(value.difficulty) : undefined,
		totalDifficulty:
			value.totalDifficulty !== undefined
				? BigInt(value.totalDifficulty)
				: undefined,
	};
}
