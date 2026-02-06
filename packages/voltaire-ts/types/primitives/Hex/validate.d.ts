import type { HexType } from "./HexType.js";
/**
 * Validate hex string
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param value - String to validate as hex
 * @returns Validated hex string
 * @throws {InvalidFormatError} If missing 0x prefix or contains invalid hex characters
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.validate('0x1234'); // HexType
 * ```
 */
export declare function validate(value: string): HexType;
//# sourceMappingURL=validate.d.ts.map