import type { HexType } from "./HexType.js";
/**
 * Create Hex from string or bytes
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param value - Hex string or bytes
 * @returns Hex string
 * @throws {InvalidFormatError} If input is not a string/Uint8Array or string is missing 0x prefix
 * @throws {import('./errors.js').InvalidCharacterError} If string contains invalid hex characters
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * const hex2 = Hex.from(new Uint8Array([0x12, 0x34]));
 * ```
 */
export declare function from(value: string | Uint8Array): HexType;
//# sourceMappingURL=from.d.ts.map