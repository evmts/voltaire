import type { HexType, Sized } from "./HexType.js";
/**
 * Assert hex has specific size
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param hex - Hex string to check
 * @param targetSize - Expected byte size
 * @returns Sized hex string
 * @throws {InvalidLengthError} If size doesn't match
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * const sized = Hex.assertSize(hex, 2); // Sized<2>
 * ```
 */
export declare function assertSize<TSize extends number>(hex: HexType, targetSize: TSize): Sized<TSize>;
//# sourceMappingURL=assertSize.d.ts.map