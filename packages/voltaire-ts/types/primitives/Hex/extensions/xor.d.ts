import type { HexType } from "../HexType.js";
/**
 * XOR two hex values (bitwise exclusive OR)
 * Voltaire extension - not available in Ox
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param a - First hex value
 * @param b - Second hex value
 * @returns XOR result
 * @throws {never}
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.xor('0xff', '0x0f'); // '0xf0'
 * ```
 */
export declare function xor(a: HexType, b: HexType): HexType;
//# sourceMappingURL=xor.d.ts.map