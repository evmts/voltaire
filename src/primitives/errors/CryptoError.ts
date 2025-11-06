import { PrimitiveError } from "./PrimitiveError.js";

/**
 * Base crypto error
 */
export class CryptoError extends PrimitiveError {
	constructor(message: string, options?: { code?: string; context?: Record<string, any> }) {
		super(message, { code: options?.code || "CRYPTO_ERROR", context: options?.context });
		this.name = "CryptoError";
	}
}

/**
 * Invalid signature error (e.g., signature verification failed)
 */
export class InvalidSignatureError extends CryptoError {
	constructor(message: string, options?: { code?: string; context?: Record<string, any> }) {
		super(message, { code: options?.code || "INVALID_SIGNATURE", context: options?.context });
		this.name = "InvalidSignatureError";
	}
}

/**
 * Invalid public key error (e.g., malformed public key)
 */
export class InvalidPublicKeyError extends CryptoError {
	constructor(message: string, options?: { code?: string; context?: Record<string, any> }) {
		super(message, { code: options?.code || "INVALID_PUBLIC_KEY", context: options?.context });
		this.name = "InvalidPublicKeyError";
	}
}

/**
 * Invalid private key error (e.g., out of range private key)
 */
export class InvalidPrivateKeyError extends CryptoError {
	constructor(message: string, options?: { code?: string; context?: Record<string, any> }) {
		super(message, { code: options?.code || "INVALID_PRIVATE_KEY", context: options?.context });
		this.name = "InvalidPrivateKeyError";
	}
}
