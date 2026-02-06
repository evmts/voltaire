import type { HexType } from "./HexType.js";
/**
 * Convert bytes to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param bytes - Byte array to convert
 * @returns Hex string
 * @throws {never}
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.fromBytes(new Uint8Array([0x12, 0x34])); // '0x1234'
 * ```
 */
export declare function fromBytes(bytes: Uint8Array): HexType;
//# sourceMappingURL=fromBytes.d.ts.map