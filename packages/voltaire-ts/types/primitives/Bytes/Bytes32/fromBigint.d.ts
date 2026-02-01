/**
 * Create Bytes32 from bigint (padded to 32 bytes)
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {bigint} value - Bigint to convert
 * @returns {import('./Bytes32Type.js').Bytes32Type} Bytes32 (big-endian)
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const bytes = Bytes32.fromBigint(123456789012345678901234567890n);
 * ```
 */
export function fromBigint(value: bigint): import("./Bytes32Type.js").Bytes32Type;
//# sourceMappingURL=fromBigint.d.ts.map