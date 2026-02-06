// @ts-nocheck
import { COMPRESSED_PUBLIC_KEY_SIZE, STEALTH_META_ADDRESS_SIZE, } from "./constants.js";
import { InvalidPublicKeyError } from "./errors.js";
/**
 * Generate stealth meta-address from spending and viewing public keys
 *
 * Concatenates 33-byte compressed spending and viewing public keys
 * into 66-byte stealth meta-address for ERC-5564.
 *
 * @see https://eips.ethereum.org/EIPS/eip-5564#stealth-meta-address-format
 * @see https://voltaire.tevm.sh/primitives/stealth-address for StealthAddress documentation
 * @since 0.0.0
 * @param {import('./StealthAddressType.js').SpendingPublicKey} spendingPubKey - 33-byte compressed spending public key
 * @param {import('./StealthAddressType.js').ViewingPublicKey} viewingPubKey - 33-byte compressed viewing public key
 * @returns {import('./StealthAddressType.js').StealthMetaAddress} 66-byte stealth meta-address
 * @throws {InvalidPublicKeyError} If either public key has invalid length
 * @example
 * ```javascript
 * import * as StealthAddress from './primitives/StealthAddress/index.js';
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 *
 * const spendingPubKey = StealthAddress.compressPublicKey(
 *   Secp256k1.derivePublicKey(spendingPrivateKey)
 * );
 * const viewingPubKey = StealthAddress.compressPublicKey(
 *   Secp256k1.derivePublicKey(viewingPrivateKey)
 * );
 * const metaAddress = StealthAddress.generateMetaAddress(spendingPubKey, viewingPubKey);
 * console.log(metaAddress.length); // 66
 * ```
 */
export function generateMetaAddress(spendingPubKey, viewingPubKey) {
    if (spendingPubKey.length !== COMPRESSED_PUBLIC_KEY_SIZE) {
        throw new InvalidPublicKeyError(`Spending public key must be ${COMPRESSED_PUBLIC_KEY_SIZE} bytes, got ${spendingPubKey.length}`, {
            code: "INVALID_SPENDING_PUBLIC_KEY_LENGTH",
            context: { actualLength: spendingPubKey.length },
        });
    }
    if (viewingPubKey.length !== COMPRESSED_PUBLIC_KEY_SIZE) {
        throw new InvalidPublicKeyError(`Viewing public key must be ${COMPRESSED_PUBLIC_KEY_SIZE} bytes, got ${viewingPubKey.length}`, {
            code: "INVALID_VIEWING_PUBLIC_KEY_LENGTH",
            context: { actualLength: viewingPubKey.length },
        });
    }
    const metaAddress = new Uint8Array(STEALTH_META_ADDRESS_SIZE);
    metaAddress.set(spendingPubKey, 0);
    metaAddress.set(viewingPubKey, COMPRESSED_PUBLIC_KEY_SIZE);
    return /** @type {import('./StealthAddressType.js').StealthMetaAddress} */ (metaAddress);
}
