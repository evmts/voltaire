import { Hex } from "../Hex/index.js";

/**
 * Convert BlockNumber to hex string
 *
 * @param {import('./BlockNumberType.js').BlockNumberType} blockNumber - BlockNumber to convert
 * @returns {import('../Hex/index.js').HexType} Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = BlockNumber.toHex(bn);
 * // "0x3039" (for block 12345)
 * ```
 */
export function toHex(blockNumber) {
	return Hex.fromBigInt(blockNumber);
}
