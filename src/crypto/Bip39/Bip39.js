// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";
export * from "./BrandedMnemonic.js";
export * from "./BrandedSeed.js";
export * from "./BrandedEntropy.js";

import { assertValidMnemonic } from "./assertValidMnemonic.js";
import {
	ENTROPY_128,
	ENTROPY_160,
	ENTROPY_192,
	ENTROPY_224,
	ENTROPY_256,
	SEED_LENGTH,
} from "./constants.js";
import { entropyToMnemonic } from "./entropyToMnemonic.js";
import { generateMnemonic } from "./generateMnemonic.js";
import { getEntropyBits } from "./getEntropyBits.js";
import { getWordCount } from "./getWordCount.js";
import { mnemonicToSeed } from "./mnemonicToSeed.js";
import { mnemonicToSeedSync } from "./mnemonicToSeedSync.js";
import { validateMnemonic } from "./validateMnemonic.js";

// Export individual functions
export {
	generateMnemonic,
	entropyToMnemonic,
	validateMnemonic,
	assertValidMnemonic,
	mnemonicToSeed,
	mnemonicToSeedSync,
	getWordCount,
	getEntropyBits,
};

/**
 * BIP-39 Mnemonic Implementation
 *
 * Provides mnemonic generation, validation, and seed derivation
 * following the BIP-39 standard for deterministic key generation.
 *
 * @example
 * ```typescript
 * import { Bip39 } from './Bip39.js';
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
export const Bip39 = {
	generateMnemonic,
	entropyToMnemonic,
	validateMnemonic,
	assertValidMnemonic,
	mnemonicToSeed,
	mnemonicToSeedSync,
	getWordCount,
	getEntropyBits,
	ENTROPY_128,
	ENTROPY_160,
	ENTROPY_192,
	ENTROPY_224,
	ENTROPY_256,
	SEED_LENGTH,
};
