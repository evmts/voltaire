import type { HexType } from "./HexType.js";
/**
 * Check if string is valid hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param value - String to validate
 * @returns True if valid hex format
 * @throws {never}
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.isHex('0x1234'); // true
 * Hex.isHex('1234');   // false
 * Hex.isHex('0xZZZZ'); // false
 * ```
 */
export declare function isHex(value: string): value is HexType;
//# sourceMappingURL=isHex.d.ts.map