import { Hash } from "../Hash/index.js";
import { COMPONENT_SIZE } from "./constants.js";
import { fromP256 } from "./fromP256.js";
import { fromSecp256k1 } from "./fromSecp256k1.js";
import { isCanonical } from "./isCanonical.js";
/**
 * Normalize ECDSA signature to canonical form (s = n - s if s > n/2)
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature to normalize
 * @returns {import('./SignatureType.js').SignatureType} Normalized signature
 *
 * @example
 * ```typescript
 * const normalized = Signature.normalize(sig);
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: signature normalization requires many conditions
export function normalize(signature) {
    // Ed25519 signatures are always canonical
    if (signature.algorithm === "ed25519") {
        return signature;
    }
    // If already canonical, return as-is
    if (isCanonical(signature)) {
        return signature;
    }
    // Extract r and s
    const r = signature.slice(0, COMPONENT_SIZE);
    const s = signature.slice(COMPONENT_SIZE, COMPONENT_SIZE * 2);
    // Get curve order
    const curveOrder = signature.algorithm === "secp256k1"
        ? // secp256k1 curve order
            new Uint8Array([
                0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
                0xff, 0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48,
                0xa0, 0x3b, 0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
            ])
        : // P-256 curve order
            new Uint8Array([
                0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff,
                0xff, 0xff, 0xff, 0xff, 0xff, 0xbc, 0xe6, 0xfa, 0xad, 0xa7, 0x17,
                0x9e, 0x84, 0xf3, 0xb9, 0xca, 0xc2, 0xfc, 0x63, 0x25, 0x51,
            ]);
    // Calculate s_normalized = n - s
    const sNormalized = new Uint8Array(COMPONENT_SIZE);
    let borrow = 0;
    for (let i = COMPONENT_SIZE - 1; i >= 0; i--) {
        const diff = (curveOrder[i] ?? 0) - (s[i] ?? 0) - borrow;
        sNormalized[i] = diff & 0xff;
        borrow = diff < 0 ? 1 : 0;
    }
    // Return new signature with normalized s
    if (signature.algorithm === "secp256k1") {
        // Flip v if present
        // For legacy (v = 27 or 28): flip between 27 and 28
        // For EIP-155 (v >= 35): v = chainId * 2 + 35 + yParity, flip parity with ±1
        // yParity is encoded in the least significant bit relative to the base (chainId * 2 + 35)
        // Since base is always odd, flipping yParity means: odd v -> even v (+1), even v -> odd v (-1)
        let v = signature.v;
        if (v !== undefined) {
            if (v === 27 || v === 28) {
                v = v === 27 ? 28 : 27;
            }
            else if (v >= 35) {
                // EIP-155: flip parity - odd becomes even (+1), even becomes odd (-1)
                v = v % 2 === 0 ? v - 1 : v + 1;
            }
        }
        return fromSecp256k1(Hash.from(r), Hash.from(sNormalized), v);
    }
    return fromP256(Hash.from(r), Hash.from(sNormalized));
}
