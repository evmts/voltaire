import type { HexType } from "./HexType.js";
/**
 * Convert bigint to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param value - BigInt to convert (must be non-negative)
 * @param size - Optional byte size for padding
 * @returns Hex string
 * @throws {Error} If value is negative
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.fromBigInt(255n);      // '0xff'
 * Hex.fromBigInt(255n, 32);  // '0x00...00ff' (32 bytes)
 * ```
 */
export declare function fromBigInt(value: bigint, size?: number): HexType;
//# sourceMappingURL=fromBigInt.d.ts.map