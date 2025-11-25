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

// Import types first
import type { SiweMessageType, Signature, ValidationResult } from "./SiweMessageType.js";
import type { AddressType } from "../Address/AddressType.js";
import type { HashType } from "../Hash/HashType.js";
import type { Secp256k1PublicKeyType } from "../../crypto/Secp256k1/Secp256k1PublicKeyType.js";

// Import crypto dependencies
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { recoverPublicKey as secp256k1RecoverPublicKey } from "../../crypto/Secp256k1/recoverPublicKey.js";
import { FromPublicKey } from "../Address/fromPublicKey.js";

// Import factories with proper types
import { GetMessageHash as _GetMessageHash } from "./getMessageHash.js";
import { Verify as _Verify } from "./verify.js";
import { VerifyMessage as _VerifyMessage } from "./verifyMessage.js";

// Type the factory functions properly
type GetMessageHashFn = (message: SiweMessageType) => Uint8Array;
type VerifyFn = (message: SiweMessageType, signature: Signature) => boolean;
type VerifyMessageFn = (message: SiweMessageType, signature: Signature, options?: { now?: Date }) => ValidationResult;

// Re-export factories (tree-shakeable) with proper types
export const GetMessageHash: (deps: { keccak256: (data: Uint8Array) => Uint8Array }) => GetMessageHashFn = _GetMessageHash as any;
export const Verify: (deps: {
	keccak256: (data: Uint8Array) => Uint8Array;
	secp256k1RecoverPublicKey: (signature: { r: Uint8Array; s: Uint8Array; v: number }, hash: HashType) => Secp256k1PublicKeyType;
	addressFromPublicKey: (x: bigint, y: bigint) => AddressType;
}) => VerifyFn = _Verify as any;
export const VerifyMessage: (deps: {
	keccak256: (data: Uint8Array) => Uint8Array;
	secp256k1RecoverPublicKey: (signature: { r: Uint8Array; s: Uint8Array; v: number }, hash: HashType) => Secp256k1PublicKeyType;
	addressFromPublicKey: (x: bigint, y: bigint) => AddressType;
}) => VerifyMessageFn = _VerifyMessage as any;

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

// Type-safe wrappers for public API
type CreateParams<
	TDomain extends string = string,
	TAddress extends AddressType = AddressType,
	TUri extends string = string,
	TChainId extends number = number,
> = {
	domain: TDomain;
	address: TAddress;
	uri: TUri;
	chainId: TChainId;
	statement?: string;
	expirationTime?: string;
	notBefore?: string;
	requestId?: string;
	resources?: string[];
	nonce?: string;
	issuedAt?: string;
};

export function create<
	TDomain extends string = string,
	TAddress extends AddressType = AddressType,
	TUri extends string = string,
	TChainId extends number = number,
>(params: CreateParams<TDomain, TAddress, TUri, TChainId>): SiweMessageType<TDomain, TAddress, TUri, "1", TChainId> {
	return _create(params);
}

export function format(message: SiweMessageType): string {
	return _format(message);
}

export function generateNonce(length?: number): string {
	return _generateNonce(length);
}

export function parse(text: string): SiweMessageType {
	return _parse(text);
}

export function validate(message: SiweMessageType, options?: { now?: Date }): ValidationResult {
	return _validate(message, options);
}

// Export internal functions (tree-shakeable)
export {
	_create,
	_format,
	_generateNonce,
	getMessageHash as _getMessageHash,
	_parse,
	_validate,
	verify as _verify,
	verifyMessage as _verifyMessage,
};

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
export function Siwe<
	TDomain extends string = string,
	TAddress extends AddressType = AddressType,
	TUri extends string = string,
	TChainId extends number = number,
>(params: CreateParams<TDomain, TAddress, TUri, TChainId>): SiweMessageType<TDomain, TAddress, TUri, "1", TChainId> {
	const result = create(params);
	Object.setPrototypeOf(result, Siwe.prototype);
	return result;
}

// Static constructors
Siwe.create = <
	TDomain extends string = string,
	TAddress extends AddressType = AddressType,
	TUri extends string = string,
	TChainId extends number = number,
>(params: CreateParams<TDomain, TAddress, TUri, TChainId>): SiweMessageType<TDomain, TAddress, TUri, "1", TChainId> => {
	const result = create(params);
	Object.setPrototypeOf(result, Siwe.prototype);
	return result;
};
Siwe.create.prototype = Siwe.prototype;

Siwe.parse = (message: string): SiweMessageType => {
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
Siwe.prototype.format = function (this: SiweMessageType): string {
	return format(this);
};
Siwe.prototype.getMessageHash = function (this: SiweMessageType): Uint8Array {
	return getMessageHash(this);
};
Siwe.prototype.validate = function (this: SiweMessageType): ValidationResult {
	return validate(this);
};
Siwe.prototype.verify = function (this: SiweMessageType, signature: Signature): boolean {
	return verify(this, signature);
};
