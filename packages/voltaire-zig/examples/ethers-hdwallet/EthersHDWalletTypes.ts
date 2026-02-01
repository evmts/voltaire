/**
 * TypeScript type definitions for ethers-compatible HD wallet
 * @module EthersHDWalletTypes
 */

/**
 * Mnemonic phrase type
 */
export type MnemonicPhrase = string;

/**
 * Derivation path type (e.g., "m/44'/60'/0'/0/0")
 */
export type DerivationPath = string;

/**
 * Hex string type (0x-prefixed)
 */
export type HexString = `0x${string}`;

/**
 * Wordlist interface for BIP-39 word lists
 */
export interface Wordlist {
	locale: string;
	split(phrase: string): string[];
	join(words: string[]): string;
	getWord(index: number): string;
	getWordIndex(word: string): number;
}

/**
 * Mnemonic instance interface (ethers-compatible)
 */
export interface MnemonicLike {
	readonly phrase: string;
	readonly password: string;
	readonly entropy: HexString;
	readonly wordlist: Wordlist;
	computeSeed(): Uint8Array;
}

/**
 * HD Node properties (ethers-compatible)
 */
export interface HDNodeLike {
	readonly publicKey: HexString;
	readonly fingerprint: HexString;
	readonly parentFingerprint: HexString;
	readonly chainCode: HexString;
	readonly path: DerivationPath | null;
	readonly index: number;
	readonly depth: number;
	readonly extendedKey: string;
}

/**
 * HD Node Wallet interface with private key (ethers-compatible)
 */
export interface HDNodeWalletLike extends HDNodeLike {
	readonly privateKey: HexString;
	readonly address: string;
	readonly mnemonic: MnemonicLike | null;

	derivePath(path: string): HDNodeWalletLike;
	deriveChild(index: number): HDNodeWalletLike;
	neuter(): HDNodeVoidWalletLike;
	hasPath(): this is HDNodeWalletLike & { path: DerivationPath };

	// Signer methods
	signMessage(message: string | Uint8Array): Promise<HexString>;
	signTransaction(transaction: unknown): Promise<unknown>;
	signTypedData(typedData: unknown): Promise<HexString>;
}

/**
 * HD Node Void Wallet interface (public key only, ethers-compatible)
 */
export interface HDNodeVoidWalletLike extends HDNodeLike {
	readonly address: string;

	derivePath(path: string): HDNodeVoidWalletLike;
	deriveChild(index: number): HDNodeVoidWalletLike;
	hasPath(): this is HDNodeVoidWalletLike & { path: DerivationPath };
}

/**
 * Options for creating HDNodeWallet from mnemonic
 */
export interface FromMnemonicOptions {
	mnemonic: MnemonicLike;
	path?: DerivationPath;
}

/**
 * Options for creating HDNodeWallet from phrase
 */
export interface FromPhraseOptions {
	phrase: string;
	password?: string;
	path?: DerivationPath;
	wordlist?: Wordlist;
}

/**
 * Options for creating random HDNodeWallet
 */
export interface CreateRandomOptions {
	password?: string;
	path?: DerivationPath;
	wordlist?: Wordlist;
	entropyBits?: 128 | 160 | 192 | 224 | 256;
}

/**
 * Static factory methods interface for HDNodeWallet
 */
export interface HDNodeWalletStatic {
	fromMnemonic(mnemonic: MnemonicLike, path?: DerivationPath): HDNodeWalletLike;
	fromPhrase(
		phrase: string,
		password?: string,
		path?: DerivationPath,
		wordlist?: Wordlist,
	): HDNodeWalletLike;
	fromSeed(seed: Uint8Array): HDNodeWalletLike;
	fromExtendedKey(extendedKey: string): HDNodeWalletLike | HDNodeVoidWalletLike;
	createRandom(
		password?: string,
		path?: DerivationPath,
		wordlist?: Wordlist,
	): HDNodeWalletLike;
}

/**
 * Static factory methods interface for Mnemonic
 */
export interface MnemonicStatic {
	fromPhrase(
		phrase: string,
		password?: string,
		wordlist?: Wordlist,
	): MnemonicLike;
	fromEntropy(
		entropy: Uint8Array | HexString,
		password?: string,
		wordlist?: Wordlist,
	): MnemonicLike;
	entropyToPhrase(entropy: Uint8Array | HexString, wordlist?: Wordlist): string;
	phraseToEntropy(phrase: string, wordlist?: Wordlist): HexString;
	isValidMnemonic(phrase: string, wordlist?: Wordlist): boolean;
}

/**
 * Constants
 */
export const HARDENED_BIT = 0x80000000;
export const DEFAULT_PATH: DerivationPath = "m/44'/60'/0'/0/0";
