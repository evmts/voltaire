/**
 * Create InitCode from hex string
 *
 * @param {string} hex - Hex string
 * @returns {import('./InitCodeType.js').InitCodeType} InitCode
 * @throws {Error} If hex string is invalid
 * @example
 * ```javascript
 * import * as InitCode from './primitives/InitCode/index.js';
 * const code = InitCode.fromHex("0x608060405234801561001057600080fd5b50...");
 * ```
 */
export function fromHex(hex: string): import("./InitCodeType.js").InitCodeType;
//# sourceMappingURL=fromHex.d.ts.map