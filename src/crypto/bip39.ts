/**
 * BIP-39 Mnemonic Implementation
 *
 * Provides mnemonic generation, validation, and seed derivation
 * following the BIP-39 standard for deterministic key generation.
 *
 * Uses @scure/bip39 - audited, widely-used implementation by Paul Miller
 * (same author as @noble/curves used elsewhere in this codebase).
 *
 * @example
 * ```typescript
 * import { Bip39 } from './bip39.js';
 *
 * // Generate 12-word mnemonic
 * const mnemonic = Bip39.generateMnemonic(128);
 * console.log(mnemonic); // "abandon abandon abandon..."
 *
 * // Validate mnemonic
 * const isValid = Bip39.validateMnemonic(mnemonic);
 *
 * // Derive seed
 * const seed = await Bip39.mnemonicToSeed(mnemonic, "optional passphrase");
 * ```
 */

import {
	entropyToMnemonic as _entropyToMnemonic,
	generateMnemonic as _generateMnemonic,
	mnemonicToSeed as _mnemonicToSeed,
	mnemonicToSeedSync as _mnemonicToSeedSync,
	validateMnemonic as _validateMnemonic,
} from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

const englishWordlist = wordlist;

// ============================================================================
// Error Types
// ============================================================================

export class Bip39Error extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Bip39Error";
	}
}

export class InvalidMnemonicError extends Bip39Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidMnemonicError";
	}
}

export class InvalidEntropyError extends Bip39Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidEntropyError";
	}
}

// ============================================================================
// Main Bip39 Namespace
// ============================================================================

export namespace Bip39 {
	// ==========================================================================
	// Core Types
	// ==========================================================================

	export type Mnemonic = string;
	export type Seed = Uint8Array;
	export type Entropy = Uint8Array;

	// ==========================================================================
	// Constants
	// ==========================================================================

	/** 128 bits = 12 words */
	export const ENTROPY_128 = 128;
	/** 160 bits = 15 words */
	export const ENTROPY_160 = 160;
	/** 192 bits = 18 words */
	export const ENTROPY_192 = 192;
	/** 224 bits = 21 words */
	export const ENTROPY_224 = 224;
	/** 256 bits = 24 words */
	export const ENTROPY_256 = 256;

	/** BIP-39 seed length (512 bits / 64 bytes) */
	export const SEED_LENGTH = 64;

	// ==========================================================================
	// Mnemonic Generation
	// ==========================================================================

	/**
	 * Generate a BIP-39 mnemonic phrase
	 *
	 * @param strength - Entropy strength in bits (128, 160, 192, 224, or 256)
	 * @param wordlist - Optional wordlist (defaults to English)
	 * @returns Mnemonic phrase
	 *
	 * @example
	 * ```typescript
	 * // Generate 12-word mnemonic (128 bits)
	 * const mnemonic12 = Bip39.generateMnemonic(128);
	 *
	 * // Generate 24-word mnemonic (256 bits)
	 * const mnemonic24 = Bip39.generateMnemonic(256);
	 * ```
	 */
	export function generateMnemonic(
		strength: 128 | 160 | 192 | 224 | 256 = 256,
		wordlist: string[] = englishWordlist,
	): Mnemonic {
		try {
			return _generateMnemonic(wordlist, strength);
		} catch (error) {
			throw new Bip39Error(`Mnemonic generation failed: ${error}`);
		}
	}

	/**
	 * Generate mnemonic from custom entropy
	 *
	 * @param entropy - Entropy bytes (16, 20, 24, 28, or 32 bytes)
	 * @param wordlist - Optional wordlist (defaults to English)
	 * @returns Mnemonic phrase
	 *
	 * @example
	 * ```typescript
	 * const entropy = crypto.getRandomValues(new Uint8Array(32));
	 * const mnemonic = Bip39.entropyToMnemonic(entropy);
	 * ```
	 */
	export function entropyToMnemonic(
		entropy: Entropy,
		wordlist: string[] = englishWordlist,
	): Mnemonic {
		const validLengths = [16, 20, 24, 28, 32];
		if (!validLengths.includes(entropy.length)) {
			throw new InvalidEntropyError(
				`Entropy must be 16, 20, 24, 28, or 32 bytes, got ${entropy.length}`,
			);
		}

		try {
			return _entropyToMnemonic(entropy, wordlist);
		} catch (error) {
			throw new Bip39Error(`Entropy to mnemonic conversion failed: ${error}`);
		}
	}

	// ==========================================================================
	// Mnemonic Validation
	// ==========================================================================

	/**
	 * Validate a BIP-39 mnemonic phrase
	 *
	 * @param mnemonic - Mnemonic phrase to validate
	 * @param wordlist - Optional wordlist (defaults to English)
	 * @returns True if valid, false otherwise
	 *
	 * @example
	 * ```typescript
	 * const mnemonic = "abandon abandon abandon...";
	 * if (Bip39.validateMnemonic(mnemonic)) {
	 *   console.log("Valid mnemonic");
	 * }
	 * ```
	 */
	export function validateMnemonic(
		mnemonic: Mnemonic,
		wordlist: string[] = englishWordlist,
	): boolean {
		try {
			return _validateMnemonic(mnemonic, wordlist);
		} catch {
			return false;
		}
	}

	/**
	 * Validate mnemonic or throw error
	 *
	 * @param mnemonic - Mnemonic phrase to validate
	 * @param wordlist - Optional wordlist (defaults to English)
	 * @throws {InvalidMnemonicError} If mnemonic is invalid
	 *
	 * @example
	 * ```typescript
	 * try {
	 *   Bip39.assertValidMnemonic(mnemonic);
	 * } catch (e) {
	 *   console.error("Invalid mnemonic:", e.message);
	 * }
	 * ```
	 */
	export function assertValidMnemonic(
		mnemonic: Mnemonic,
		wordlist: string[] = englishWordlist,
	): void {
		if (!validateMnemonic(mnemonic, wordlist)) {
			throw new InvalidMnemonicError("Invalid BIP-39 mnemonic phrase");
		}
	}

	// ==========================================================================
	// Seed Derivation
	// ==========================================================================

	/**
	 * Convert mnemonic to seed (async)
	 *
	 * @param mnemonic - BIP-39 mnemonic phrase
	 * @param passphrase - Optional passphrase for additional security
	 * @returns 64-byte seed
	 *
	 * @example
	 * ```typescript
	 * const seed = await Bip39.mnemonicToSeed(mnemonic, "my passphrase");
	 * ```
	 */
	export async function mnemonicToSeed(
		mnemonic: Mnemonic,
		passphrase = "",
	): Promise<Seed> {
		assertValidMnemonic(mnemonic);

		try {
			return await _mnemonicToSeed(mnemonic, passphrase);
		} catch (error) {
			throw new Bip39Error(`Seed derivation failed: ${error}`);
		}
	}

	/**
	 * Convert mnemonic to seed (sync)
	 *
	 * @param mnemonic - BIP-39 mnemonic phrase
	 * @param passphrase - Optional passphrase for additional security
	 * @returns 64-byte seed
	 *
	 * @example
	 * ```typescript
	 * const seed = Bip39.mnemonicToSeedSync(mnemonic);
	 * ```
	 */
	export function mnemonicToSeedSync(
		mnemonic: Mnemonic,
		passphrase = "",
	): Seed {
		assertValidMnemonic(mnemonic);

		try {
			return _mnemonicToSeedSync(mnemonic, passphrase);
		} catch (error) {
			throw new Bip39Error(`Seed derivation failed: ${error}`);
		}
	}

	// ==========================================================================
	// Utility Functions
	// ==========================================================================

	/**
	 * Get word count from entropy bits
	 *
	 * @param entropyBits - Entropy in bits
	 * @returns Number of words in mnemonic
	 *
	 * @example
	 * ```typescript
	 * Bip39.getWordCount(128); // 12
	 * Bip39.getWordCount(256); // 24
	 * ```
	 */
	export function getWordCount(entropyBits: number): number {
		if (entropyBits % 32 !== 0 || entropyBits < 128 || entropyBits > 256) {
			throw new InvalidEntropyError(
				"Entropy must be 128, 160, 192, 224, or 256 bits",
			);
		}
		return (entropyBits / 32) * 3;
	}

	/**
	 * Get entropy bits from word count
	 *
	 * @param wordCount - Number of words
	 * @returns Entropy in bits
	 *
	 * @example
	 * ```typescript
	 * Bip39.getEntropyBits(12); // 128
	 * Bip39.getEntropyBits(24); // 256
	 * ```
	 */
	export function getEntropyBits(wordCount: number): number {
		if (![12, 15, 18, 21, 24].includes(wordCount)) {
			throw new Bip39Error("Word count must be 12, 15, 18, 21, or 24");
		}
		return (wordCount / 3) * 32;
	}
}
