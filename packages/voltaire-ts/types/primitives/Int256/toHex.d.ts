/**
 * Convert Int256 to hex string (two's complement)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./Int256Type.js').BrandedInt256} value - Int256 value
 * @returns {import('../Hex/HexType.js').HexType} Hex string with 0x prefix
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-1n);
 * Int256.toHex(a); // "0xffffffffffffffffffffffffffffffff"
 * const b = Int256.from(255n);
 * Int256.toHex(b); // "0x000000000000000000000000000000ff"
 * ```
 */
export function toHex(value: import("./Int256Type.js").BrandedInt256): import("../Hex/HexType.js").HexType;
//# sourceMappingURL=toHex.d.ts.map