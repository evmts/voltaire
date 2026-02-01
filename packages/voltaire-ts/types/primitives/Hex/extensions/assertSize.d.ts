import type { HexType } from "../HexType.js";
/**
 * Assert that hex value has a specific size, throws if not
 * Voltaire extension - not available in Ox
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param value - Hex value to check
 * @param size - Expected size in bytes
 * @throws {InvalidLengthError} If hex value doesn't have the specified size
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.assertSize('0x1234', 2); // No error
 * Hex.assertSize('0x1234', 4); // Throws error
 * ```
 */
export declare function assertSize(value: HexType, size: number): void;
//# sourceMappingURL=assertSize.d.ts.map