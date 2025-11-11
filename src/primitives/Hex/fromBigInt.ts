import type { BrandedHex } from "./BrandedHex.js";

/**
 * Convert bigint to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param value - BigInt to convert
 * @param size - Optional byte size for padding
 * @returns Hex string
 * @throws {never}
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.fromBigInt(255n);      // '0xff'
 * Hex.fromBigInt(255n, 32);  // '0x00...00ff' (32 bytes)
 * ```
 */
export function fromBigInt(value: bigint, size?: number): BrandedHex {
	let hex = value.toString(16);
	if (size !== undefined) {
		hex = hex.padStart(size * 2, "0");
	}
	return `0x${hex}` as BrandedHex;
}
