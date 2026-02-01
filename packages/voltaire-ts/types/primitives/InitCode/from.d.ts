/**
 * Create InitCode from various input types
 *
 * @see https://voltaire.tevm.sh/primitives/init-code for InitCode documentation
 * @since 0.0.0
 * @param {string | Uint8Array} value - Hex string or Uint8Array
 * @returns {import('./InitCodeType.js').InitCodeType} InitCode
 * @throws {never}
 * @example
 * ```javascript
 * import * as InitCode from './primitives/InitCode/index.js';
 * const code1 = InitCode.from("0x608060405234801561001057600080fd5b50...");
 * const code2 = InitCode.from(new Uint8Array([0x60, 0x80, 0x60, 0x40, ...]));
 * ```
 */
export function from(value: string | Uint8Array): import("./InitCodeType.js").InitCodeType;
//# sourceMappingURL=from.d.ts.map