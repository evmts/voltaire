/**
 * AES-GCM synchronous native bindings using Zig C ABI (Bun FFI / Node-API),
 * paired with full WebCrypto-compatible AesGcm namespace parity.
 */

import { AesGcm as AesGcmJS } from "../../crypto/AesGcm/AesGcm.js";
import {
	AES128_KEY_SIZE,
	AES256_KEY_SIZE,
	NONCE_SIZE,
	TAG_SIZE,
} from "../../crypto/AesGcm/constants.js";
import {
	AesGcmError,
	DecryptionError,
	InvalidKeyError,
	InvalidNonceError,
} from "../../crypto/AesGcm/errors.js";
import {
	allocateOutput,
	loadNativeSync,
	safeBufferPtr,
} from "../../native-loader/index.js";

const EMPTY_AD = new Uint8Array(0);

function validateKeyAndNonce(key: Uint8Array, nonce: Uint8Array): 16 | 32 {
	if (key.length !== AES128_KEY_SIZE && key.length !== AES256_KEY_SIZE) {
		throw new InvalidKeyError(
			`AES-GCM key must be ${AES128_KEY_SIZE} or ${AES256_KEY_SIZE} bytes, got ${key.length}`,
		);
	}
	if (nonce.length !== NONCE_SIZE) {
		throw new InvalidNonceError(
			`AES-GCM nonce must be ${NONCE_SIZE} bytes, got ${nonce.length}`,
		);
	}
	return key.length;
}

/**
 * Encrypt raw bytes synchronously with AES-128-GCM or AES-256-GCM via native Zig FFI.
 * Output format: `ciphertext || 16-byte authentication tag`.
 */
export function encryptRawSync(
	plaintext: Uint8Array,
	key: Uint8Array,
	nonce: Uint8Array,
	additionalData: Uint8Array = EMPTY_AD,
): Uint8Array {
	const keySize = validateKeyAndNonce(key, nonce);
	const lib = loadNativeSync();
	const output = allocateOutput(plaintext.length + TAG_SIZE);
	const code =
		keySize === AES128_KEY_SIZE
			? lib.aesGcm128Encrypt(
					safeBufferPtr(plaintext),
					plaintext.length,
					key,
					nonce,
					safeBufferPtr(additionalData),
					additionalData.length,
					output,
				)
			: lib.aesGcm256Encrypt(
					safeBufferPtr(plaintext),
					plaintext.length,
					key,
					nonce,
					safeBufferPtr(additionalData),
					additionalData.length,
					output,
				);
	if (code !== 0) {
		throw new AesGcmError(`Native AES-GCM encryption failed (code ${code})`);
	}
	return output;
}

/**
 * Decrypt raw bytes synchronously with AES-128-GCM or AES-256-GCM via native Zig FFI.
 * Input format: `ciphertext || 16-byte authentication tag`.
 */
export function decryptRawSync(
	ciphertext: Uint8Array,
	key: Uint8Array,
	nonce: Uint8Array,
	additionalData: Uint8Array = EMPTY_AD,
): Uint8Array {
	const keySize = validateKeyAndNonce(key, nonce);
	if (ciphertext.length < TAG_SIZE) {
		throw new DecryptionError(
			`Ciphertext too short: must be at least ${TAG_SIZE} bytes for authentication tag`,
		);
	}
	const lib = loadNativeSync();
	const output = allocateOutput(ciphertext.length - TAG_SIZE);
	const code =
		keySize === AES128_KEY_SIZE
			? lib.aesGcm128Decrypt(
					safeBufferPtr(ciphertext),
					ciphertext.length,
					key,
					nonce,
					safeBufferPtr(additionalData),
					additionalData.length,
					safeBufferPtr(output),
				)
			: lib.aesGcm256Decrypt(
					safeBufferPtr(ciphertext),
					ciphertext.length,
					key,
					nonce,
					safeBufferPtr(additionalData),
					additionalData.length,
					safeBufferPtr(output),
				);
	if (code !== 0) {
		throw new DecryptionError(
			`Native AES-GCM decryption/authentication failed (code ${code})`,
		);
	}
	return output;
}

export const AesGcm = {
	...AesGcmJS,
	encryptRawSync,
	decryptRawSync,
} satisfies typeof AesGcmJS & {
	encryptRawSync: typeof encryptRawSync;
	decryptRawSync: typeof decryptRawSync;
};
