/**
 * Create Signature from RPC format
 *
 * @param {{ r: string, s: string, yParity?: string | number, v?: string | number }} rpc - RPC format signature
 * @returns {import('./SignatureType.js').SignatureType} Signature
 *
 * @example
 * ```javascript
 * import * as Signature from './primitives/Signature/index.js';
 * const sig = Signature.fromRpc({
 *   r: '0x...',
 *   s: '0x...',
 *   yParity: '0x0'
 * });
 * ```
 */
export function fromRpc(rpc: {
    r: string;
    s: string;
    yParity?: string | number;
    v?: string | number;
}): import("./SignatureType.js").SignatureType;
//# sourceMappingURL=fromRpc.d.ts.map