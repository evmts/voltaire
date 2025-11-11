import { BIP44_PATH } from "./constants.js";
import { derivePath } from "./derivePath.js";

/**
 * Derive Bitcoin address key using BIP-44 standard path.
 *
 * Path format: m/44'/0'/account'/0/index
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Root HD key with private key
 * @param {number} [account=0] - BIP-44 account index (default: 0)
 * @param {number} [index=0] - Address index (default: 0)
 * @returns {import('./BrandedExtendedKey.js').BrandedExtendedKey} Derived extended key for Bitcoin address
 * @throws {InvalidPathError} If derivation path is invalid or derivation fails
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * const root = HDWallet.fromSeed(seed);
 * const btcKey = HDWallet.deriveBitcoin(root, 0, 0); // m/44'/0'/0'/0/0
 * ```
 */
export function deriveBitcoin(key, account = 0, index = 0) {
	const path = BIP44_PATH.BTC(account, index);
	return derivePath(key, path);
}
