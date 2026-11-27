import { PrimitiveError } from "../errors/index.js";

/**
 * @typedef {{
 *   code?: number | string;
 *   context?: Record<string, unknown>;
 *   docsPath?: string;
 *   cause?: unknown;
 * }} StealthAddressErrorOptions
 */

/**
 * Base error for StealthAddress operations
 */
export class StealthAddressError extends PrimitiveError {
	/**
	 * @param {string} message
	 * @param {StealthAddressErrorOptions} [options]
	 */
	constructor(message, options = {}) {
		super(message, {
			code: "STEALTH_ADDRESS_ERROR",
			docsPath: "/primitives/stealth-address#error-handling",
			...options,
			cause: options.cause instanceof Error ? options.cause : undefined,
		});
		this.name = "StealthAddressError";
	}
}

/**
 * Invalid stealth meta-address format or length
 */
export class InvalidStealthMetaAddressError extends StealthAddressError {
	/**
	 * @param {string} message
	 * @param {StealthAddressErrorOptions} [options]
	 */
	constructor(message, options = {}) {
		super(message, {
			code: "INVALID_STEALTH_META_ADDRESS",
			...options,
		});
		this.name = "InvalidStealthMetaAddressError";
	}
}

/**
 * Invalid public key format or length
 */
export class InvalidPublicKeyError extends StealthAddressError {
	/**
	 * @param {string} message
	 * @param {StealthAddressErrorOptions} [options]
	 */
	constructor(message, options = {}) {
		super(message, {
			code: "INVALID_PUBLIC_KEY",
			...options,
		});
		this.name = "InvalidPublicKeyError";
	}
}

/**
 * Invalid ephemeral public key
 */
export class InvalidEphemeralPublicKeyError extends StealthAddressError {
	/**
	 * @param {string} message
	 * @param {StealthAddressErrorOptions} [options]
	 */
	constructor(message, options = {}) {
		super(message, {
			code: "INVALID_EPHEMERAL_PUBLIC_KEY",
			...options,
		});
		this.name = "InvalidEphemeralPublicKeyError";
	}
}

/**
 * Invalid announcement format
 */
export class InvalidAnnouncementError extends StealthAddressError {
	/**
	 * @param {string} message
	 * @param {StealthAddressErrorOptions} [options]
	 */
	constructor(message, options = {}) {
		super(message, {
			code: "INVALID_ANNOUNCEMENT",
			...options,
		});
		this.name = "InvalidAnnouncementError";
	}
}

/**
 * Stealth address generation failed
 */
export class StealthAddressGenerationError extends StealthAddressError {
	/**
	 * @param {string} message
	 * @param {StealthAddressErrorOptions} [options]
	 */
	constructor(message, options = {}) {
		super(message, {
			code: "STEALTH_ADDRESS_GENERATION_FAILED",
			...options,
		});
		this.name = "StealthAddressGenerationError";
	}
}
