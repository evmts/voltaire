// @ts-nocheck
import { PrimitiveError } from "../errors/index.js";

/**
 * Base error for StealthAddress operations
 */
export class StealthAddressError extends PrimitiveError {
	constructor(message, options = {}) {
		super(message, {
			code: "STEALTH_ADDRESS_ERROR",
			docsPath: "/primitives/stealth-address#error-handling",
			...options,
		});
		this.name = "StealthAddressError";
	}
}

/**
 * Invalid stealth meta-address format or length
 */
export class InvalidStealthMetaAddressError extends StealthAddressError {
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
	constructor(message, options = {}) {
		super(message, {
			code: "STEALTH_ADDRESS_GENERATION_FAILED",
			...options,
		});
		this.name = "StealthAddressGenerationError";
	}
}
