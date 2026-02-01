/**
 * Convert Signature to tuple format [yParity, r, s] for transaction envelopes
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature to convert
 * @returns {[number, Uint8Array, Uint8Array]} Tuple [yParity, r, s]
 * @throws {InvalidAlgorithmError} If signature is not secp256k1
 * @throws {InvalidSignatureFormatError} If signature has no v value
 *
 * @example
 * ```javascript
 * import * as Signature from './primitives/Signature/index.js';
 * const sig = Signature.fromSecp256k1(r, s, 27);
 * const [yParity, r, s] = Signature.toTuple(sig);
 * ```
 */
export function toTuple(signature: import("./SignatureType.js").SignatureType): [number, Uint8Array, Uint8Array];
//# sourceMappingURL=toTuple.d.ts.map