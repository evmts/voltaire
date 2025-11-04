// @ts-nocheck
/**
 * HD Wallet (Hierarchical Deterministic Wallets) Implementation
 *
 * Implements BIP-32 (HD key derivation) and BIP-44 (multi-account hierarchy)
 * for deterministic key generation from a single seed.
 *
 * Uses @scure/bip32 - audited, widely-used implementation by Paul Miller.
 *
 * @example
 * ```typescript
 * import { HDWallet } from './HDWallet/index.js';
 * import { Bip39 } from '../bip39.js';
 *
 * // From mnemonic
 * const mnemonic = Bip39.generateMnemonic(256);
 * const seed = await Bip39.mnemonicToSeed(mnemonic);
 * const root = HDWallet.fromSeed(seed);
 *
 * // Derive Ethereum account (BIP-44)
 * const account0 = HDWallet.derivePath(root, "m/44'/60'/0'/0/0");
 * console.log(HDWallet.getPrivateKey(account0)); // Uint8Array(32)
 * console.log(HDWallet.getPublicKey(account0));  // Uint8Array(33)
 * ```
 */

export * from "./errors.js";
export * from "./constants.js";
export * from "./BrandedExtendedKey.js";

import { canDeriveHardened } from "./canDeriveHardened.js";
import { deriveBitcoin } from "./deriveBitcoin.js";
import { deriveChild } from "./deriveChild.js";
import { deriveEthereum } from "./deriveEthereum.js";
import { derivePath } from "./derivePath.js";
import { fromExtendedKey } from "./fromExtendedKey.js";
import { fromPublicExtendedKey } from "./fromPublicExtendedKey.js";
import { fromSeed } from "./fromSeed.js";
import { getChainCode } from "./getChainCode.js";
import { getPrivateKey } from "./getPrivateKey.js";
import { getPublicKey } from "./getPublicKey.js";
import { isHardenedPath } from "./isHardenedPath.js";
import { isValidPath } from "./isValidPath.js";
import { parseIndex } from "./parseIndex.js";
import { toExtendedPrivateKey } from "./toExtendedPrivateKey.js";
import { toExtendedPublicKey } from "./toExtendedPublicKey.js";
import { toPublic } from "./toPublic.js";
import { HARDENED_OFFSET, CoinType, BIP44_PATH } from "./constants.js";

// Export individual functions
export {
	fromSeed,
	fromExtendedKey,
	fromPublicExtendedKey,
	derivePath,
	deriveChild,
	deriveEthereum,
	deriveBitcoin,
	toExtendedPrivateKey,
	toExtendedPublicKey,
	getPrivateKey,
	getPublicKey,
	getChainCode,
	canDeriveHardened,
	toPublic,
	isHardenedPath,
	isValidPath,
	parseIndex,
};

/**
 * @typedef {import('./BrandedExtendedKey.js').BrandedExtendedKey} BrandedExtendedKey
 */

/**
 * HDWallet namespace - collection of HD wallet operations
 */
export const HDWallet = {
	// Factory methods
	fromSeed,
	fromExtendedKey,
	fromPublicExtendedKey,

	// Derivation methods
	derivePath,
	deriveChild,
	deriveEthereum,
	deriveBitcoin,

	// Serialization methods
	toExtendedPrivateKey,
	toExtendedPublicKey,

	// Property getters
	getPrivateKey,
	getPublicKey,
	getChainCode,
	canDeriveHardened,
	toPublic,

	// Path utilities
	isHardenedPath,
	isValidPath,
	parseIndex,

	// Constants
	HARDENED_OFFSET,
	CoinType,
	BIP44_PATH,
};

// Attach methods to ExtendedKey prototype
// Note: We don't create a constructor pattern here because ExtendedKey comes from @scure/bip32
// The methods are exported as standalone functions that take ExtendedKey as first argument
