/**
 * Create Bytes32 from string, bytes, number, or bigint
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {string | Uint8Array | number | bigint} value - Value to convert
 * @returns {import('./Bytes32Type.js').Bytes32Type} Bytes32
 * @throws {Error} If input is invalid or wrong length
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const bytes1 = Bytes32.from('0x' + '12'.repeat(32));
 * const bytes2 = Bytes32.from(new Uint8Array(32));
 * const bytes3 = Bytes32.from(42);
 * const bytes4 = Bytes32.from(123n);
 * ```
 */
export function from(value: string | Uint8Array | number | bigint): import("./Bytes32Type.js").Bytes32Type;
//# sourceMappingURL=from.d.ts.map