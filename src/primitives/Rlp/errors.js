/**
 * RLP error types - re-export from RlpError.ts
 * @module
 */

// Re-export the typed errors from RlpError.ts
export { RlpEncodingError, RlpDecodingError } from "./RlpError.js";
import { RlpDecodingError } from "./RlpError.js";

/**
 * @typedef {"InputTooShort" | "InputTooLong" | "LeadingZeros" | "NonCanonicalSize" | "InvalidLength" | "UnexpectedInput" | "InvalidRemainder" | "ExtraZeros" | "RecursionDepthExceeded"} ErrorType
 */

/**
 * Legacy RLP error class for backwards compatibility
 * @deprecated Use RlpEncodingError or RlpDecodingError instead
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: RLP-specific Error class for backwards compatibility
export class Error extends RlpDecodingError {
	/**
	 * @param {ErrorType} type
	 * @param {string} [message]
	 */
	constructor(type, message) {
		super(message || type, {
			code: `RLP_${type.toUpperCase().replace(/([a-z])([A-Z])/g, "$1_$2")}`,
		});
		this.name = "RlpError";
		/** @type {ErrorType} */
		this.type = type;
	}
}

// Legacy export
export const RlpError = Error;
