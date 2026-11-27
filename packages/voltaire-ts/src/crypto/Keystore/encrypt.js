import { keccak_256 } from "@noble/hashes/sha3.js";
import { encryptAesCtr } from "./aesCtr.js";
import {
	EncryptionError,
	InvalidPbkdf2IterationsError,
	InvalidScryptNError,
} from "./errors.js";
import { derivePbkdf2, deriveScrypt } from "./kdf.js";
import { bytesToHex, concat, generateUuid } from "./utils.js";

/**
 * Encrypt private key to Web3 Secret Storage v3 keystore
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('../../primitives/PrivateKey/PrivateKeyType.js').PrivateKeyType} privateKey - Private key (32 bytes)
 * @param {string} password - Password for encryption
 * @param {import('./KeystoreType.js').EncryptOptions} [options] - Encryption options
 * @returns {Promise<import('./KeystoreType.js').KeystoreV3>} Encrypted keystore
 * @throws {EncryptionError} If encryption fails
 * @example
 * ```javascript
 * import * as Keystore from './crypto/Keystore/index.js';
 * import * as PrivateKey from './primitives/PrivateKey/index.js';
 *
 * const privateKey = PrivateKey.from('0x...');
 * const keystore = await Keystore.encrypt(privateKey, 'my-password');
 * ```
 */
export async function encrypt(privateKey, password, options = {}) {
	try {
		const {
			kdf = "scrypt",
			uuid = generateUuid(),
			iv = crypto.getRandomValues(new Uint8Array(16)),
			salt = crypto.getRandomValues(new Uint8Array(32)),
			scryptN = 262144,
			scryptR = 8,
			scryptP = 1,
			pbkdf2C = 262144,
			includeAddress = false,
		} = options;
		void includeAddress;

		const derivedKey =
			kdf === "scrypt"
				? deriveScrypt(password, salt, scryptN, scryptR, scryptP, 32)
				: derivePbkdf2(password, salt, pbkdf2C, 32);

		const encryptionKey = derivedKey.slice(0, 16);
		const macKey = derivedKey.slice(16, 32);
		const ciphertext = encryptAesCtr(privateKey, encryptionKey, iv);
		const mac = keccak_256(concat(macKey, ciphertext));

		/** @type {import('./KeystoreType.js').KeystoreV3} */
		const keystore = {
			version: 3,
			id: uuid,
			crypto: {
				cipher: "aes-128-ctr",
				ciphertext: bytesToHex(ciphertext),
				cipherparams: { iv: bytesToHex(iv) },
				kdf,
				kdfparams:
					kdf === "scrypt"
						? {
								dklen: 32,
								n: scryptN,
								r: scryptR,
								p: scryptP,
								salt: bytesToHex(salt),
							}
						: {
								c: pbkdf2C,
								dklen: 32,
								prf: "hmac-sha256",
								salt: bytesToHex(salt),
							},
				mac: bytesToHex(mac),
			},
		};

		return keystore;
	} catch (error) {
		if (
			error instanceof InvalidScryptNError ||
			error instanceof InvalidPbkdf2IterationsError
		) {
			throw error;
		}
		const msg = error instanceof Error ? error.message : String(error);
		throw new EncryptionError(`Encryption failed: ${msg}`);
	}
}
