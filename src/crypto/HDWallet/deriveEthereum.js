import { BIP44_PATH } from "./constants.js";
import { derivePath } from "./derivePath.js";

/**
 * Derive Ethereum address key using BIP-44
 *
 * Path: m/44'/60'/account'/0/index
 *
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Root HD key
 * @param {number} [account=0] - Account index
 * @param {number} [index=0] - Address index
 * @returns {import('./BrandedExtendedKey.js').BrandedExtendedKey} Derived key for Ethereum address
 * @throws {InvalidPathError} If derivation fails
 *
 * @example
 * ```typescript
 * const root = HDWallet.fromSeed(seed);
 * const ethKey0 = HDWallet.deriveEthereum(root, 0, 0);
 * const ethKey1 = HDWallet.deriveEthereum(root, 0, 1);
 * ```
 */
export function deriveEthereum(key, account = 0, index = 0) {
	const path = BIP44_PATH.ETH(account, index);
	return derivePath(key, path);
}
