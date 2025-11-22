// @ts-nocheck
import { decodeParams } from "./decodeParams.js";
import { encodeParams } from "./encodeParams.js";
import { getSignature } from "./getSignature.js";

/**
 * Factory function for creating AbiError instances
 * Note: Named "AbiError" to avoid conflict with JavaScript's built-in Error
 */
export function AbiError(error) {
	// Validate error structure
	if (!error || error.type !== "error") {
		throw new TypeError("Invalid error definition: must have type='error'");
	}
	// Create a plain object copy
	return { ...error };
}
