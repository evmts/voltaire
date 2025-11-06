// @ts-nocheck
import * as BrandedError from "./BrandedError/index.ts";

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
AbiError.getSelector = BrandedError.getSelector;
AbiError.getSignature = BrandedError.getSignature;
AbiError.encodeParams = BrandedError.encodeParams;
AbiError.decodeParams = BrandedError.decodeParams;

// Set up AbiError.prototype to inherit from Object.prototype
Object.setPrototypeOf(AbiError.prototype, Object.prototype);

// Instance methods using .call.bind pattern
AbiError.prototype.getSelector = BrandedError.getSelector.call.bind(
	BrandedError.getSelector,
);
AbiError.prototype.getSignature = BrandedError.getSignature.call.bind(
	BrandedError.getSignature,
);
AbiError.prototype.encodeParams = function (args) {
	return BrandedError.encodeParams(this, args);
};
AbiError.prototype.decodeParams = function (data) {
	return BrandedError.decodeParams(this, data);
};

AbiError.prototype[Symbol.for("nodejs.util.inspect.custom")] = function (
	depth,
	options,
) {
	return `AbiError(${this.name})`;
};

AbiError.prototype.toString = function () {
	return `AbiError(${BrandedError.getSignature(this)})`;
};
