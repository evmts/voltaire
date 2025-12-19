// @ts-nocheck

/**
 * Base error for Keystore operations
 */
export class KeystoreError extends Error {
	constructor(message) {
		super(message);
		this.name = "KeystoreError";
	}
}

/**
 * Error thrown when MAC verification fails
 */
export class InvalidMacError extends KeystoreError {
	constructor(
		message = "MAC verification failed - invalid password or corrupted keystore",
	) {
		super(message);
		this.name = "InvalidMacError";
	}
}

/**
 * Error thrown when keystore version is unsupported
 */
export class UnsupportedVersionError extends KeystoreError {
	constructor(version) {
		super(
			`Unsupported keystore version: ${version}. Only version 3 is supported.`,
		);
		this.name = "UnsupportedVersionError";
		this.version = version;
	}
}

/**
 * Error thrown when KDF is unsupported
 */
export class UnsupportedKdfError extends KeystoreError {
	constructor(kdf) {
		super(`Unsupported KDF: ${kdf}. Only 'scrypt' and 'pbkdf2' are supported.`);
		this.name = "UnsupportedKdfError";
		this.kdf = kdf;
	}
}

/**
 * Error thrown when decryption fails
 */
export class DecryptionError extends KeystoreError {
	constructor(message = "Decryption failed") {
		super(message);
		this.name = "DecryptionError";
	}
}

/**
 * Error thrown when encryption fails
 */
export class EncryptionError extends KeystoreError {
	constructor(message = "Encryption failed") {
		super(message);
		this.name = "EncryptionError";
	}
}
