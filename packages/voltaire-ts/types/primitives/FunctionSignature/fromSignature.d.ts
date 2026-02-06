/**
 * Create FunctionSignature from signature string
 *
 * @param {string} signature - Function signature (e.g., "transfer(address,uint256)")
 * @returns {import('./FunctionSignatureType.js').FunctionSignatureType} Function signature
 * @throws {Error} If signature is invalid
 * @example
 * ```javascript
 * import * as FunctionSignature from './primitives/FunctionSignature/index.js';
 * const sig = FunctionSignature.fromSignature('transfer(address,uint256)');
 * ```
 */
export function fromSignature(signature: string): import("./FunctionSignatureType.js").FunctionSignatureType;
//# sourceMappingURL=fromSignature.d.ts.map