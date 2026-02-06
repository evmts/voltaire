/**
 * Parse stealth meta-address into spending and viewing public keys
 *
 * Splits 66-byte meta-address into 33-byte compressed public keys.
 *
 * @see https://eips.ethereum.org/EIPS/eip-5564#stealth-meta-address-format
 * @see https://voltaire.tevm.sh/primitives/stealth-address for StealthAddress documentation
 * @since 0.0.0
 * @param {import('./StealthAddressType.js').StealthMetaAddress} metaAddress - 66-byte stealth meta-address
 * @returns {{ spendingPubKey: import('./StealthAddressType.js').SpendingPublicKey, viewingPubKey: import('./StealthAddressType.js').ViewingPublicKey }} Parsed public keys
 * @throws {InvalidStealthMetaAddressError} If meta-address length is invalid
 * @example
 * ```javascript
 * import * as StealthAddress from './primitives/StealthAddress/index.js';
 * const metaAddress = new Uint8Array(66);
 * const { spendingPubKey, viewingPubKey } = StealthAddress.parseMetaAddress(metaAddress);
 * console.log(spendingPubKey.length); // 33
 * console.log(viewingPubKey.length); // 33
 * ```
 */
export function parseMetaAddress(metaAddress: import("./StealthAddressType.js").StealthMetaAddress): {
    spendingPubKey: import("./StealthAddressType.js").SpendingPublicKey;
    viewingPubKey: import("./StealthAddressType.js").ViewingPublicKey;
};
//# sourceMappingURL=parseMetaAddress.d.ts.map