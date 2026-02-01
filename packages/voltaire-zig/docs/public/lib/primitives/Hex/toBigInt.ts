import type { HexType } from "./HexType.js";

/**
 * Convert hex to bigint
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param hex - Hex string to convert
 * @returns BigInt value
 * @throws {never}
 * @example
 * ```ts
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0xff');
 * const big = Hex.toBigInt(hex); // 255n
 * ```
 */
export function toBigInt(hex: HexType): bigint {
	return BigInt(hex);
}
