import type { HexType } from "./HexType.js";
/**
 * Convert string to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param str - String to convert
 * @returns Hex string
 * @throws {never}
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.fromString('hello'); // '0x68656c6c6f'
 * ```
 */
export declare function fromString(str: string): HexType;
//# sourceMappingURL=fromString.d.ts.map