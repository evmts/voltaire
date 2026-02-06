import { fromSecp256k1 } from "./fromSecp256k1.js";
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
export function fromTuple(tuple, chainId) {
    const [yParity, r, s] = tuple;
    // Calculate v from yParity and optional chainId
    let v;
    if (chainId !== undefined) {
        // EIP-155: v = chainId * 2 + 35 + yParity
        v = chainId * 2 + 35 + yParity;
    }
    else {
        // Legacy: v = 27 + yParity
        v = 27 + yParity;
    }
    return fromSecp256k1(r, s, v);
}
