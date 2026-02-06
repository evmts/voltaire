import type { Uint256Type } from "./Uint256Type.js";
/**
 * Type guard for Uint256
 *
 * @see https://voltaire.tevm.sh/primitives/uint256 for Uint256 documentation
 * @since 0.1.42
 * @param value - Value to check
 * @returns true if value is valid Uint256
 * @throws {never}
 * @example
 * ```typescript
 * import { isUint256 } from '@tevm/voltaire';
 * if (isUint256(value)) {
 *   const hex = Uint256.toHex(value);
 * }
 * ```
 */
export declare function isUint256(value: unknown): value is Uint256Type;
//# sourceMappingURL=isUint256.d.ts.map