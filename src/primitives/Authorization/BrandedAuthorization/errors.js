import {
	InvalidFormatError,
	InvalidRangeError,
	InvalidSignatureError,
} from "../../errors/index.js";

/**
 * Authorization chain ID must be non-zero
 *
 * @throws {InvalidFormatError}
 */
export class InvalidChainIdError extends InvalidFormatError {
	/**
	 * @param {bigint} chainId
	 * @param {object} [options]
	 * @param {Error} [options.cause]
	 */
	constructor(chainId, options) {
		super("Chain ID must be non-zero", {
			code: "AUTHORIZATION_INVALID_CHAIN_ID",
			value: chainId,
			expected: "non-zero bigint",
			docsPath: "/primitives/authorization/validate#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidChainIdError";
	}
}

/**
 * Authorization address cannot be zero address
 *
 * @throws {InvalidFormatError}
 */
export class InvalidAddressError extends InvalidFormatError {
	/**
	 * @param {Uint8Array} address
	 * @param {object} [options]
	 * @param {Error} [options.cause]
	 */
	constructor(address, options) {
		super("Address cannot be zero address", {
			code: "AUTHORIZATION_INVALID_ADDRESS",
			value: address,
			expected: "non-zero address",
			docsPath: "/primitives/authorization/validate#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidAddressError";
	}
}

/**
 * Authorization yParity must be 0 or 1
 *
 * @throws {InvalidRangeError}
 */
export class InvalidYParityError extends InvalidRangeError {
	/**
	 * @param {number} yParity
	 * @param {object} [options]
	 * @param {Error} [options.cause]
	 */
	constructor(yParity, options) {
		super("yParity must be 0 or 1", {
			code: "AUTHORIZATION_INVALID_YPARITY",
			value: yParity,
			expected: "0 or 1",
			docsPath: "/primitives/authorization/validate#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidYParityError";
	}
}

/**
 * Authorization signature component cannot be zero
 *
 * @throws {InvalidSignatureError}
 */
export class InvalidSignatureComponentError extends InvalidSignatureError {
	/**
	 * @param {string} component - 'r' or 's'
	 * @param {bigint} value
	 * @param {object} [options]
	 * @param {Error} [options.cause]
	 */
	constructor(component, value, options) {
		super(`Signature ${component} cannot be zero`, {
			code: `AUTHORIZATION_INVALID_SIGNATURE_${component.toUpperCase()}`,
			context: { component, value },
			docsPath: "/primitives/authorization/validate#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidSignatureComponentError";
	}
}

/**
 * Authorization signature r must be less than curve order
 *
 * @throws {InvalidRangeError}
 */
export class InvalidSignatureRangeError extends InvalidRangeError {
	/**
	 * @param {bigint} value
	 * @param {bigint} max
	 * @param {object} [options]
	 * @param {Error} [options.cause]
	 */
	constructor(value, max, options) {
		super("Signature r must be less than curve order", {
			code: "AUTHORIZATION_INVALID_SIGNATURE_RANGE",
			value,
			expected: `< ${max}`,
			docsPath: "/primitives/authorization/validate#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidSignatureRangeError";
	}
}

/**
 * Authorization signature s too high (malleable signature)
 *
 * @throws {InvalidSignatureError}
 */
export class MalleableSignatureError extends InvalidSignatureError {
	/**
	 * @param {bigint} s
	 * @param {bigint} max
	 * @param {object} [options]
	 * @param {Error} [options.cause]
	 */
	constructor(s, max, options) {
		super("Signature s too high (malleable signature)", {
			code: "AUTHORIZATION_MALLEABLE_SIGNATURE",
			context: { s, max },
			docsPath: "/primitives/authorization/validate#error-handling",
			cause: options?.cause,
		});
		this.name = "MalleableSignatureError";
	}
}
