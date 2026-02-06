/**
 * @typedef {Object} P256SignOptions
 * @property {boolean | Uint8Array} [extraEntropy] - Extra entropy for signature generation.
 *   - `false`: Deterministic signatures (RFC 6979) - same inputs always produce same signature
 *   - `true`: Add randomness to signatures (different each time)
 *   - `Uint8Array`: Custom entropy to add
 *   Defaults to `undefined` which uses RFC 6979 deterministic signing.
 * @property {boolean} [lowS] - Ensure low-S signature form (default: true in noble/curves)
 */
/**
 * Sign a message hash with a private key
 *
 * Uses deterministic ECDSA (RFC 6979) for signature generation by default.
 * Set `extraEntropy: false` to explicitly ensure deterministic signatures
 * matching ox/viem behavior.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('../../primitives/Hash/index.js').HashType | import('../SHA256/SHA256HashType.js').SHA256Hash | Uint8Array} messageHash - 32-byte message hash to sign (accepts HashType, SHA256Hash, or raw Uint8Array)
 * @param {import('./P256PrivateKeyType.js').P256PrivateKeyType} privateKey - 32-byte private key
 * @param {P256SignOptions} [options] - Signing options
 * @returns {import('./P256SignatureType.js').P256SignatureType} ECDSA signature with r, s components
 * @throws {InvalidPrivateKeyError} If private key is invalid
 * @throws {P256Error} If signing fails
 * @example
 * ```javascript
 * import * as P256 from './crypto/P256/index.js';
 * import * as SHA256 from './crypto/SHA256/index.js';
 *
 * // Using SHA256 hash (common for P256/ECDSA)
 * const messageHash = SHA256.hash(message);
 *
 * // Deterministic signature (same inputs = same signature)
 * const signature = P256.sign(messageHash, privateKey, { extraEntropy: false });
 *
 * // Default behavior (RFC 6979 deterministic)
 * const sig2 = P256.sign(messageHash, privateKey);
 * ```
 */
export function sign(messageHash: import("../../primitives/Hash/index.js").HashType | import("../SHA256/SHA256HashType.js").SHA256Hash | Uint8Array, privateKey: import("./P256PrivateKeyType.js").P256PrivateKeyType, options?: P256SignOptions): import("./P256SignatureType.js").P256SignatureType;
export type P256SignOptions = {
    /**
     * - Extra entropy for signature generation.
     * - `false`: Deterministic signatures (RFC 6979) - same inputs always produce same signature
     * - `true`: Add randomness to signatures (different each time)
     * - `Uint8Array`: Custom entropy to add
     * Defaults to `undefined` which uses RFC 6979 deterministic signing.
     */
    extraEntropy?: boolean | Uint8Array<ArrayBufferLike> | undefined;
    /**
     * - Ensure low-S signature form (default: true in noble/curves)
     */
    lowS?: boolean | undefined;
};
//# sourceMappingURL=sign.d.ts.map