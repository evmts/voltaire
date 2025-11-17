// @ts-nocheck

// Export type definitions
export type {
	SiweMessageType,
	BrandedMessage,
	Signature,
	ValidationResult,
	ValidationError,
} from "./SiweMessageType.js";
export {
	InvalidSiweMessageError,
	MissingFieldError,
	InvalidFieldError,
	InvalidNonceLengthError,
	SiweParseError,
} from "./errors.js";

// Import crypto dependencies
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { recoverPublicKey as secp256k1RecoverPublicKey } from "../../crypto/Secp256k1/recoverPublicKey.js";
import { FromPublicKey } from "../Address/fromPublicKey.js";

// Import factories
import { GetMessageHash } from "./getMessageHash.js";
import { Verify } from "./verify.js";
import { VerifyMessage } from "./verifyMessage.js";

// Export factories (tree-shakeable)
export { GetMessageHash, Verify, VerifyMessage };

// Import non-crypto functions
import { create } from "./create.js";
import { format } from "./format.js";
import { generateNonce } from "./generateNonce.js";
import { parse } from "./parse.js";
import { validate } from "./validate.js";

// Create crypto wrappers with auto-injected dependencies
const addressFromPublicKey = FromPublicKey({ keccak256 });
const getMessageHash = GetMessageHash({ keccak256 });
const verify = Verify({
	keccak256,
	secp256k1RecoverPublicKey,
	addressFromPublicKey,
});
const verifyMessage = VerifyMessage({
	keccak256,
	secp256k1RecoverPublicKey,
	addressFromPublicKey,
});

// Export individual functions (public API)
export {
	create,
	format,
	generateNonce,
	getMessageHash,
	parse,
	validate,
	verify,
	verifyMessage,
};

// Export internal functions (tree-shakeable)
export {
	create as _create,
	format as _format,
	generateNonce as _generateNonce,
	getMessageHash as _getMessageHash,
	parse as _parse,
	validate as _validate,
	verify as _verify,
	verifyMessage as _verifyMessage,
};

// Namespace export
export const BrandedSiwe = {
	create,
	format,
	generateNonce,
	getMessageHash,
	parse,
	validate,
	verify,
	verifyMessage,
};

/**
 * Factory function for creating SIWE Message instances
 */
export function Siwe(params) {
	const result = create(params);
	Object.setPrototypeOf(result, Siwe.prototype);
	return result;
}

// Static constructors
Siwe.create = (params) => {
	const result = create(params);
	Object.setPrototypeOf(result, Siwe.prototype);
	return result;
};
Siwe.create.prototype = Siwe.prototype;

Siwe.parse = (message) => {
	const result = parse(message);
	Object.setPrototypeOf(result, Siwe.prototype);
	return result;
};
Siwe.parse.prototype = Siwe.prototype;

// Static utility methods (don't return Siwe instances)
Siwe.format = format;
Siwe.generateNonce = generateNonce;
Siwe.getMessageHash = getMessageHash;
Siwe.validate = validate;
Siwe.verify = verify;
Siwe.verifyMessage = verifyMessage;

// Set up Siwe.prototype to inherit from Object.prototype
Object.setPrototypeOf(Siwe.prototype, Object.prototype);

// Instance methods
Siwe.prototype.format = function () {
	return format(this);
};
Siwe.prototype.getMessageHash = function () {
	return getMessageHash(this);
};
Siwe.prototype.validate = function () {
	return validate(this);
};
Siwe.prototype.verify = function (signature, publicKey) {
	return verify(this, signature, publicKey);
};
