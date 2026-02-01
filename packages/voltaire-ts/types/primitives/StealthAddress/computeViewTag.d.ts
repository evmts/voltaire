/**
 * Compute view tag from hashed shared secret
 *
 * Extracts first byte of hashed shared secret as view tag.
 * Enables fast rejection of non-matching stealth addresses.
 *
 * @see https://eips.ethereum.org/EIPS/eip-5564#view-tags
 * @see https://voltaire.tevm.sh/primitives/stealth-address for StealthAddress documentation
 * @since 0.0.0
 * @param {Uint8Array} hashedSharedSecret - 32-byte keccak256 hash of shared secret
 * @returns {import('./StealthAddressType.js').ViewTag} View tag (first byte as number)
 * @example
 * ```javascript
 * import * as StealthAddress from './primitives/StealthAddress/index.js';
 * import * as Keccak256 from './crypto/Keccak256/index.js';
 *
 * const sharedSecret = new Uint8Array(32);
 * const hash = Keccak256.hash(sharedSecret);
 * const viewTag = StealthAddress.computeViewTag(hash);
 * console.log(typeof viewTag); // 'number'
 * console.log(viewTag >= 0 && viewTag <= 255); // true
 * ```
 */
export function computeViewTag(hashedSharedSecret: Uint8Array): import("./StealthAddressType.js").ViewTag;
//# sourceMappingURL=computeViewTag.d.ts.map