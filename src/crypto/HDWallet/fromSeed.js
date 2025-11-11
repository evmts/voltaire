import { HDKey } from "@scure/bip32";
import { HDWalletError, InvalidSeedError } from "./errors.js";

/**
 * Create root HD key from BIP-39 seed.
 *
 * Master key for hierarchical deterministic wallet.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} seed - BIP-39 seed bytes (typically 64 bytes from mnemonic, must be 16-64 bytes)
 * @returns {import('./BrandedExtendedKey.js').BrandedExtendedKey} Root extended key for BIP-32 derivation
 * @throws {InvalidSeedError} If seed length is not between 16 and 64 bytes
 * @throws {HDWalletError} If master key derivation fails
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * const seed = new Uint8Array(64); // From BIP-39 mnemonic
 * const root = HDWallet.fromSeed(seed);
 * ```
 */
export function fromSeed(seed) {
	if (seed.length < 16 || seed.length > 64) {
		throw new InvalidSeedError("Seed must be between 16 and 64 bytes", {
			code: "INVALID_SEED_LENGTH",
			context: { seedLength: seed.length, min: 16, max: 64 },
			docsPath: "/crypto/hdwallet/from-seed#error-handling",
		});
	}

	try {
		return /** @type {import('./BrandedExtendedKey.js').BrandedExtendedKey} */ (
			HDKey.fromMasterSeed(seed)
		);
	} catch (error) {
		throw new HDWalletError(`Failed to create HD key from seed: ${error}`, {
			code: "HD_KEY_DERIVATION_FAILED",
			context: { seedLength: seed.length },
			docsPath: "/crypto/hdwallet/from-seed#error-handling",
			cause: error instanceof Error ? error : undefined,
		});
	}
}
