import { BIP44_PATH } from "./constants.js";
import { derivePath } from "./derivePath.js";

/**
 * Derive Bitcoin address key using BIP-44
 *
 * Path: m/44'/0'/account'/0/index
 *
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Root HD key
 * @param {number} [account=0] - Account index
 * @param {number} [index=0] - Address index
 * @returns {import('./BrandedExtendedKey.js').BrandedExtendedKey} Derived key for Bitcoin address
 * @throws {InvalidPathError} If derivation fails
 *
 * @example
 * ```typescript
 * const root = HDWallet.fromSeed(seed);
 * const btcKey = HDWallet.deriveBitcoin(root, 0, 0);
 * ```
 */
export function deriveBitcoin(key, account = 0, index = 0) {
	const path = BIP44_PATH.BTC(account, index);
	return derivePath(key, path);
}
