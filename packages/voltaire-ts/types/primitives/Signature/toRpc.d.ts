/**
 * Convert Signature to RPC format (r, s, yParity as hex strings)
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature to convert
 * @returns {{ r: string, s: string, yParity: string, v?: string }} RPC format signature
 * @throws {InvalidAlgorithmError} If signature is not secp256k1
 *
 * @example
 * ```javascript
 * import * as Signature from './primitives/Signature/index.js';
 * const sig = Signature.fromSecp256k1(r, s, 27);
 * const rpc = Signature.toRpc(sig);
 * // { r: '0x...', s: '0x...', yParity: '0x0', v: '0x1b' }
 * ```
 */
export function toRpc(signature: import("./SignatureType.js").SignatureType): {
    r: string;
    s: string;
    yParity: string;
    v?: string;
};
//# sourceMappingURL=toRpc.d.ts.map