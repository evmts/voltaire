// @ts-nocheck
import { keccak_256 } from "@noble/hashes/sha3.js";
import { constantTimeEqual } from "../ConstantTime/constantTimeEqual.js";
import { decryptAesCtr } from "./aesCtr.js";
import {
	DecryptionError,
	InvalidMacError,
	InvalidPbkdf2IterationsError,
	InvalidScryptNError,
	UnsupportedKdfError,
	UnsupportedVersionError,
} from "./errors.js";
import { derivePbkdf2, deriveScrypt, MAX_DKLEN } from "./kdf.js";
import { concat, hexToBytes } from "./utils.js";

/**
 * Decrypt Web3 Secret Storage v3 keystore to private key
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./KeystoreType.js').KeystoreV3} keystore - Encrypted keystore
 * @param {string} password - Password for decryption
 * @returns {import('../../primitives/PrivateKey/PrivateKeyType.js').PrivateKeyType} Decrypted private key
 * @throws {UnsupportedVersionError} If keystore version is not 3
 * @throws {UnsupportedKdfError} If KDF is not scrypt or pbkdf2
 * @throws {InvalidMacError} If MAC verification fails (wrong password or corrupted)
 * @throws {DecryptionError} If cipher is not aes-128-ctr, IV is not 16 bytes, MAC is not 32 bytes, dklen is outside [32, 128], or decryption fails
 * @example
 * ```javascript
 * import * as Keystore from './crypto/Keystore/index.js';
 *
 * const keystore = { version: 3, id: '...', crypto: { ... } };
 * const privateKey = Keystore.decrypt(keystore, 'my-password');
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: linear validation of every keystore field
export function decrypt(keystore, password) {
	try {
		// Validate version
		if (keystore.version !== 3) {
			throw new UnsupportedVersionError(keystore.version);
		}

		const { crypto } = keystore;
		const { cipher, kdf, kdfparams, ciphertext, cipherparams, mac } = crypto;

		// Validate cipher
		if (cipher !== "aes-128-ctr") {
			throw new DecryptionError(`Unsupported cipher: ${cipher}`);
		}

		// Validate KDF
		if (kdf !== "scrypt" && kdf !== "pbkdf2") {
			throw new UnsupportedKdfError(kdf);
		}

		// Parse parameters
		const salt = hexToBytes(kdfparams.salt);
		const iv = hexToBytes(cipherparams.iv);
		const ciphertextBytes = hexToBytes(ciphertext);
		const macBytes = hexToBytes(mac);

		if (iv.length !== 16) {
			throw new DecryptionError(`IV must be 16 bytes, got ${iv.length}`);
		}
		if (macBytes.length !== 32) {
			throw new DecryptionError(`MAC must be 32 bytes, got ${macBytes.length}`);
		}
		// dklen < 32 would leave an empty or short MAC key and let a forged
		// keystore pass MAC verification. A huge dklen makes the KDF do
		// unbounded work. Reject both before running the KDF.
		if (
			!Number.isInteger(kdfparams.dklen) ||
			kdfparams.dklen < 32 ||
			kdfparams.dklen > MAX_DKLEN
		) {
			throw new DecryptionError(
				`dklen must be an integer between 32 and ${MAX_DKLEN}, got ${kdfparams.dklen}`,
			);
		}

		// Derive key from password
		let derivedKey;
		if (kdf === "scrypt") {
			const { n, r, p, dklen } =
				/** @type {import('./KeystoreType.js').ScryptParams} */ (kdfparams);
			derivedKey = deriveScrypt(password, salt, n, r, p, dklen);
		} else {
			const { c, dklen } =
				/** @type {import('./KeystoreType.js').Pbkdf2Params} */ (kdfparams);
			derivedKey = derivePbkdf2(password, salt, c, dklen);
		}

		if (derivedKey.length < 32) {
			throw new DecryptionError(
				`Derived key must be at least 32 bytes, got ${derivedKey.length}`,
			);
		}

		// Split derived key
		const encryptionKey = derivedKey.slice(0, 16);
		const macKey = derivedKey.slice(16, 32);

		// Verify MAC
		const computedMac = keccak_256(concat(macKey, ciphertextBytes));
		if (!constantTimeEqual(computedMac, macBytes)) {
			throw new InvalidMacError();
		}

		// Decrypt private key
		const privateKey = decryptAesCtr(ciphertextBytes, encryptionKey, iv);

		return /** @type {import('../../primitives/PrivateKey/PrivateKeyType.js').PrivateKeyType} */ (
			privateKey
		);
	} catch (error) {
		if (
			error instanceof DecryptionError ||
			error instanceof UnsupportedVersionError ||
			error instanceof UnsupportedKdfError ||
			error instanceof InvalidMacError ||
			error instanceof InvalidScryptNError ||
			error instanceof InvalidPbkdf2IterationsError
		) {
			throw error;
		}
		throw new DecryptionError(`Decryption failed: ${error.message}`);
	}
}
