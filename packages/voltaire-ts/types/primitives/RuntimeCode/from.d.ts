/**
 * Create RuntimeCode from various input types
 *
 * @see https://voltaire.tevm.sh/primitives/runtime-code for RuntimeCode documentation
 * @since 0.0.0
 * @param {string | Uint8Array} value - Hex string or Uint8Array
 * @returns {import('./RuntimeCodeType.js').RuntimeCodeType} RuntimeCode
 * @throws {never}
 * @example
 * ```javascript
 * import * as RuntimeCode from './primitives/RuntimeCode/index.js';
 * const code1 = RuntimeCode.from("0x6001600155");
 * const code2 = RuntimeCode.from(new Uint8Array([0x60, 0x01, 0x60, 0x01, 0x55]));
 * ```
 */
export function from(value: string | Uint8Array): import("./RuntimeCodeType.js").RuntimeCodeType;
//# sourceMappingURL=from.d.ts.map