/**
 * Create FunctionSignature from various input types
 *
 * @param {import('./FunctionSignatureType.js').FunctionSignatureLike} value - Input value
 * @returns {import('./FunctionSignatureType.js').FunctionSignatureType} Function signature
 * @throws {Error} If input is invalid
 * @example
 * ```javascript
 * import * as FunctionSignature from './primitives/FunctionSignature/index.js';
 * const sig = FunctionSignature.from('transfer(address,uint256)');
 * ```
 */
export function from(value: import("./FunctionSignatureType.js").FunctionSignatureLike): import("./FunctionSignatureType.js").FunctionSignatureType;
//# sourceMappingURL=from.d.ts.map