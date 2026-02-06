// Export type definitions
export { InvalidFieldError, InvalidNonceLengthError, InvalidSiweMessageError, MissingFieldError, SiweParseError, } from "./errors.js";
// Import crypto dependencies
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { recoverPublicKey as secp256k1RecoverPublicKey } from "../../crypto/Secp256k1/recoverPublicKey.js";
import { FromPublicKey } from "../Address/fromPublicKey.js";
// Import factories with proper types
import { GetMessageHash as _GetMessageHash } from "./getMessageHash.js";
import { Verify as _Verify } from "./verify.js";
import { VerifyMessage as _VerifyMessage } from "./verifyMessage.js";
// Re-export factories (tree-shakeable) with proper types
export const GetMessageHash = _GetMessageHash;
export const Verify = _Verify;
export const VerifyMessage = _VerifyMessage;
// Import non-crypto functions
import { create as _create } from "./create.js";
import { format as _format } from "./format.js";
import { generateNonce as _generateNonce } from "./generateNonce.js";
import { parse as _parse } from "./parse.js";
import { validate as _validate } from "./validate.js";
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
export function create(params) {
    return _create(params);
}
export function format(message) {
    return _format(message);
}
export function generateNonce(length) {
    return _generateNonce(length);
}
export function parse(text) {
    return _parse(text);
}
export function validate(message, options) {
    return _validate(message, options);
}
// Export internal functions (tree-shakeable)
export { _create, _format, _generateNonce, getMessageHash as _getMessageHash, _parse, _validate, verify as _verify, verifyMessage as _verifyMessage, };
// Re-export configured functions
export { getMessageHash, verify, verifyMessage };
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
Siwe.prototype.verify = function (signature) {
    return verify(this, signature);
};
