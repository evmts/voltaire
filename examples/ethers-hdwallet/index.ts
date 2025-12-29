/**
 * Ethers-compatible HD Wallet implementation using Voltaire primitives
 *
 * This module provides an ethers v6 compatible API for HD wallet operations,
 * powered by Voltaire's crypto and primitives modules.
 *
 * @example
 * ```typescript
 * import { HDNodeWallet, Mnemonic, defaultPath } from './index.js';
 *
 * // Create wallet from phrase
 * const wallet = HDNodeWallet.fromPhrase(
 *   "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
 * );
 * console.log(wallet.address);
 *
 * // Derive multiple accounts
 * for (let i = 0; i < 5; i++) {
 *   const account = HDNodeWallet.fromPhrase(mnemonic, "", `m/44'/60'/0'/0/${i}`);
 *   console.log(`Account ${i}: ${account.address}`);
 * }
 * ```
 *
 * @module ethers-hdwallet
 */

// Main classes
export { HDNodeWallet, HDNodeVoidWallet } from "./HDNodeWallet.js";
export { Mnemonic } from "./Mnemonic.js";

// Helper functions
export {
	defaultPath,
	getAccountPath,
	getIndexedAccountPath,
} from "./HDNodeWallet.js";

// Wordlists
export { LangEn } from "./wordlists/LangEn.js";

// Errors
export {
	HDWalletError,
	InvalidMnemonicError,
	InvalidSeedError,
	InvalidPathError,
	InvalidIndexError,
	UnsupportedOperationError,
	InvalidExtendedKeyError,
	InvalidEntropyError,
} from "./errors.js";

// Types
export type {
	MnemonicPhrase,
	DerivationPath,
	HexString,
	Wordlist,
	MnemonicLike,
	HDNodeLike,
	HDNodeWalletLike,
	HDNodeVoidWalletLike,
	FromMnemonicOptions,
	FromPhraseOptions,
	CreateRandomOptions,
	HDNodeWalletStatic,
	MnemonicStatic,
} from "./EthersHDWalletTypes.js";

// Constants
export { HARDENED_BIT, DEFAULT_PATH } from "./EthersHDWalletTypes.js";
