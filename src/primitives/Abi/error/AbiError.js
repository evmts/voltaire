// @ts-nocheck
import { decodeParams } from "./decodeParams.js";
import { encodeParams } from "./encodeParams.js";
import { getSignature } from "./getSignature.js";
import { getSelector } from "./index.js";

/**
 * Factory function for creating AbiError instances
 * Note: Named "AbiError" to avoid conflict with JavaScript's built-in Error
 */
export function AbiError(error) {
	// Validate error structure
	if (!error || error.type !== "error") {
		throw new TypeError("Invalid error definition: must have type='error'");
	}
	// Create a plain object copy with the prototype set
	const result = { ...error };
	Object.setPrototypeOf(result, AbiError.prototype);
	return result;
}

// Static methods that don't return AbiError instances
AbiError.getSelector = getSelector;
AbiError.getSignature = getSignature;
AbiError.encodeParams = encodeParams;
AbiError.decodeParams = decodeParams;

// Set up AbiError.prototype to inherit from Object.prototype
Object.setPrototypeOf(AbiError.prototype, Object.prototype);

// Instance methods using .call.bind pattern
AbiError.prototype.getSelector = getSelector.call.bind(getSelector);
AbiError.prototype.getSignature = getSignature.call.bind(getSignature);
AbiError.prototype.encodeParams = function (args) {
	return encodeParams(this, args);
};
AbiError.prototype.decodeParams = function (data) {
	return decodeParams(this, data);
};

AbiError.prototype[Symbol.for("nodejs.util.inspect.custom")] = function (
	depth,
	options,
) {
	return `AbiError(${this.name})`;
};

AbiError.prototype.toString = function () {
	return `AbiError(${getSignature(this)})`;
};
