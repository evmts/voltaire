import { Keccak256Base, Keccak256Word } from "./constants.js";

/**
 * Calculate KECCAK256 gas cost
 *
 * @param {bigint} dataSize - Size of data in bytes
 * @returns {bigint} Total gas cost
 *
 * @example
 * ```typescript
 * const cost = calculateKeccak256Cost(64n); // 30 + (2 * 6) = 42 gas
 * ```
 */
export function calculateKeccak256Cost(dataSize) {
	const words = (dataSize + 31n) / 32n;
	return Keccak256Base + words * Keccak256Word;
}
