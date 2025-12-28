import { keccak256String } from "../../Hash/index.js";
// @ts-nocheck
import { decodeParams as _decodeParams } from "./decodeParams.js";
import { encodeParams as _encodeParams } from "./encodeParams.js";
import { getSignature as _getSignature } from "./getSignature.js";

/**
 * Factory function for creating AbiError instances
 * Note: Named "AbiError" to avoid conflict with JavaScript's built-in Error
 */
export function AbiError(error) {
	// Validate error structure
	if (!error || error.type !== "error") {
		throw new TypeError("Invalid error definition: must have type='error'");
	}
	// Create object with instance methods
	return {
		...error,
		getSelector() {
			const signature = _getSignature(this);
			const hash = keccak256String(signature);
			return hash.slice(0, 4);
		},
		getSignature() {
			return _getSignature(this);
		},
		encodeParams(args) {
			return _encodeParams(this, args);
		},
		decodeParams(data) {
			return _decodeParams(this, data);
		},
	};
}
