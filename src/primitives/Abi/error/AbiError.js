import { keccak256String } from "../../Hash/index.js";
import { decodeParams as _decodeParams } from "./decodeParams.js";
import { encodeParams as _encodeParams } from "./encodeParams.js";
import { getSignature as _getSignature } from "./getSignature.js";

/**
 * Factory function for creating AbiError instances
 * Note: Named "AbiError" to avoid conflict with JavaScript's built-in Error
 * @param {import('./ErrorType.js').ErrorType} error
 * @returns {object}
 */
export function AbiError(error) {
	// Validate error structure
	if (!error || error.type !== "error") {
		throw new TypeError("Invalid error definition: must have type='error'");
	}
	/** @type {import('./ErrorType.js').ErrorType} */
	const self = error;
	// Create object with instance methods
	return {
		...error,
		getSelector() {
			const signature = _getSignature(self);
			const hash = keccak256String(signature);
			return hash.slice(0, 4);
		},
		getSignature() {
			return _getSignature(self);
		},
		/** @param {unknown[]} args */
		encodeParams(args) {
			return _encodeParams(self, args);
		},
		/** @param {Uint8Array} data */
		decodeParams(data) {
			return _decodeParams(self, data);
		},
	};
}
