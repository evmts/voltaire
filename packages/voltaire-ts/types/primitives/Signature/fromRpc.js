import { fromSecp256k1 } from "./fromSecp256k1.js";
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
export function fromRpc(rpc) {
    const { r, s, yParity, v } = rpc;
    // Parse r
    const rHex = r.startsWith("0x") ? r.slice(2) : r;
    const rBytes = new Uint8Array(32);
    const rParsed = rHex.padStart(64, "0");
    for (let i = 0; i < 32; i++) {
        rBytes[i] = Number.parseInt(rParsed.slice(i * 2, i * 2 + 2), 16);
    }
    // Parse s
    const sHex = s.startsWith("0x") ? s.slice(2) : s;
    const sBytes = new Uint8Array(32);
    const sParsed = sHex.padStart(64, "0");
    for (let i = 0; i < 32; i++) {
        sBytes[i] = Number.parseInt(sParsed.slice(i * 2, i * 2 + 2), 16);
    }
    // Parse v - prefer explicit v if provided, otherwise derive from yParity
    let vValue;
    if (v !== undefined) {
        vValue = typeof v === "string" ? Number.parseInt(v, 16) : v;
    }
    else if (yParity !== undefined) {
        const yParityNum = typeof yParity === "string" ? Number.parseInt(yParity, 16) : yParity;
        vValue = 27 + yParityNum;
    }
    return fromSecp256k1(rBytes, sBytes, vValue);
}
