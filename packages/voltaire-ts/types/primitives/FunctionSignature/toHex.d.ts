/**
 * Convert FunctionSignature selector to hex string
 *
 * @param {import('./FunctionSignatureType.js').FunctionSignatureType} functionSig - Function signature
 * @returns {string} Hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as FunctionSignature from './primitives/FunctionSignature/index.js';
 * const hex = FunctionSignature.toHex(sig);
 * // '0xa9059cbb'
 * ```
 */
export function toHex(functionSig: import("./FunctionSignatureType.js").FunctionSignatureType): string;
//# sourceMappingURL=toHex.d.ts.map