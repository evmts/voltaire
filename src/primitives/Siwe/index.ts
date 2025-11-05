// @ts-nocheck
import * as BrandedSiwe from "./BrandedSiwe/index.js";

// Re-export BrandedMessage type
export type { BrandedMessage } from "./BrandedSiwe/index.js";

/**
 * Factory function for creating SIWE Message instances
 */
export function Siwe(params) {
	const result = BrandedSiwe.create(params);
	Object.setPrototypeOf(result, Siwe.prototype);
	return result;
}

// Static constructors
Siwe.create = (params) => {
	const result = BrandedSiwe.create(params);
	Object.setPrototypeOf(result, Siwe.prototype);
	return result;
};
Siwe.create.prototype = Siwe.prototype;

Siwe.parse = (message) => {
	const result = BrandedSiwe.parse(message);
	Object.setPrototypeOf(result, Siwe.prototype);
	return result;
};
Siwe.parse.prototype = Siwe.prototype;

// Static utility methods (don't return Siwe instances)
Siwe.format = BrandedSiwe.format;
Siwe.generateNonce = BrandedSiwe.generateNonce;
Siwe.getMessageHash = BrandedSiwe.getMessageHash;
Siwe.validate = BrandedSiwe.validate;
Siwe.verify = BrandedSiwe.verify;
Siwe.verifyMessage = BrandedSiwe.verifyMessage;

// Set up Siwe.prototype to inherit from Object.prototype
Object.setPrototypeOf(Siwe.prototype, Object.prototype);

// Instance methods
Siwe.prototype.format = function () {
	return BrandedSiwe.format(this);
};
Siwe.prototype.getMessageHash = function () {
	return BrandedSiwe.getMessageHash(this);
};
Siwe.prototype.validate = function () {
	return BrandedSiwe.validate(this);
};
Siwe.prototype.verify = function (signature, publicKey) {
	return BrandedSiwe.verify(this, signature, publicKey);
};
