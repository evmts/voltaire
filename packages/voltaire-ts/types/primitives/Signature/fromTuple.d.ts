/**
 * Create Signature from tuple format [yParity, r, s]
 *
 * @param {[number, Uint8Array, Uint8Array]} tuple - Tuple [yParity, r, s]
 * @param {number} [chainId] - Optional chain ID for EIP-155 v encoding
 * @returns {import('./SignatureType.js').SignatureType} Signature
 *
 * @example
 * ```javascript
 * import * as Signature from './primitives/Signature/index.js';
 * const sig = Signature.fromTuple([0, r, s]);
 * // With chain ID for EIP-155
 * const sig155 = Signature.fromTuple([0, r, s], 1);
 * ```
 */
export function fromTuple(tuple: [number, Uint8Array, Uint8Array], chainId?: number): import("./SignatureType.js").SignatureType;
//# sourceMappingURL=fromTuple.d.ts.map