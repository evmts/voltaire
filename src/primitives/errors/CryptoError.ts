import { PrimitiveError } from "./PrimitiveError.js";

/**
 * Base crypto error
 */
export class CryptoError extends PrimitiveError {
	constructor(
		message: string,
		options?: { code?: string; context?: Record<string, any> },
	) {
		super(
			message,
			options?.context !== undefined
				? { code: options.code || "CRYPTO_ERROR", context: options.context }
				: { code: options?.code || "CRYPTO_ERROR" },
		);
		this.name = "CryptoError";
	}
}

/**
 * Invalid signature error (e.g., signature verification failed)
 */
export class InvalidSignatureError extends CryptoError {
	constructor(
		message: string,
		options?: { code?: string; context?: Record<string, any> },
	) {
		super(
			message,
			options?.context !== undefined
				? {
						code: options.code || "INVALID_SIGNATURE",
						context: options.context,
					}
				: { code: options?.code || "INVALID_SIGNATURE" },
		);
		this.name = "InvalidSignatureError";
	}
}

/**
 * Invalid public key error (e.g., malformed public key)
 */
export class InvalidPublicKeyError extends CryptoError {
	constructor(
		message: string,
		options?: { code?: string; context?: Record<string, any> },
	) {
		super(
			message,
			options?.context !== undefined
				? {
						code: options.code || "INVALID_PUBLIC_KEY",
						context: options.context,
					}
				: { code: options?.code || "INVALID_PUBLIC_KEY" },
		);
		this.name = "InvalidPublicKeyError";
	}
}

/**
 * Invalid private key error (e.g., out of range private key)
 */
export class InvalidPrivateKeyError extends CryptoError {
	constructor(
		message: string,
		options?: { code?: string; context?: Record<string, any> },
	) {
		super(
			message,
			options?.context !== undefined
				? {
						code: options.code || "INVALID_PRIVATE_KEY",
						context: options.context,
					}
				: { code: options?.code || "INVALID_PRIVATE_KEY" },
		);
		this.name = "InvalidPrivateKeyError";
	}
}
