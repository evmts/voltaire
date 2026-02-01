/**
 * Validate signature components
 *
 * Checks that r and s are within valid range [1, n-1] where n is the
 * curve order. Also enforces low-s values to prevent malleability.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./SignatureType.js').Secp256k1SignatureType} signature - ECDSA signature to validate (r and s are HashType)
 * @returns {boolean} true if signature is valid, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 * const signature = { r: Hash.from(new Uint8Array(32)), s: Hash.from(new Uint8Array(32)), v: 27 };
 * const valid = Secp256k1.isValidSignature(signature);
 * ```
 */
export function isValidSignature(signature: import("./SignatureType.js").Secp256k1SignatureType): boolean;
//# sourceMappingURL=isValidSignature.d.ts.map