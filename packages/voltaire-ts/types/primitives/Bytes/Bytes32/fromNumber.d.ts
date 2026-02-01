/**
 * Create Bytes32 from number (padded to 32 bytes)
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {number} value - Number to convert
 * @returns {import('./Bytes32Type.js').Bytes32Type} Bytes32 (big-endian)
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const bytes = Bytes32.fromNumber(42);
 * ```
 */
export function fromNumber(value: number): import("./Bytes32Type.js").Bytes32Type;
//# sourceMappingURL=fromNumber.d.ts.map