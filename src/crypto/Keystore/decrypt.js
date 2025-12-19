// @ts-nocheck
import { keccak_256 } from "@noble/hashes/sha3.js";
import { decryptAesCtr } from "./aesCtr.js";
import {
	DecryptionError,
	InvalidMacError,
	UnsupportedKdfError,
	UnsupportedVersionError,
} from "./errors.js";
import { derivePbkdf2, deriveScrypt } from "./kdf.js";
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
 * @throws {DecryptionError} If decryption fails
 * @example
 * ```javascript
 * import * as Keystore from './crypto/Keystore/index.js';
 *
 * const keystore = { version: 3, id: '...', crypto: { ... } };
 * const privateKey = Keystore.decrypt(keystore, 'my-password');
 * ```
 */
export function decrypt(keystore, password) {
	try {
		// Validate version
		if (keystore.version !== 3) {
			throw new UnsupportedVersionError(keystore.version);
		}

		const { crypto } = keystore;
		const { kdf, kdfparams, ciphertext, cipherparams, mac } = crypto;

		// Validate KDF
		if (kdf !== "scrypt" && kdf !== "pbkdf2") {
			throw new UnsupportedKdfError(kdf);
		}

		// Parse parameters
		const salt = hexToBytes(kdfparams.salt);
		const iv = hexToBytes(cipherparams.iv);
		const ciphertextBytes = hexToBytes(ciphertext);
		const macBytes = hexToBytes(mac);

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
			error instanceof UnsupportedVersionError ||
			error instanceof UnsupportedKdfError ||
			error instanceof InvalidMacError
		) {
			throw error;
		}
		throw new DecryptionError(`Decryption failed: ${error.message}`);
	}
}

/**
 * Constant-time comparison to prevent timing attacks
 *
 * @param {Uint8Array} a - First array
 * @param {Uint8Array} b - Second array
 * @returns {boolean} True if equal
 */
function constantTimeEqual(a, b) {
	if (a.length !== b.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a[i] ^ b[i];
	}

	return result === 0;
}
