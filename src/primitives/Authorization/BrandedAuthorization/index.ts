// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";
export * from "./types.js";
export * from "./BrandedAuthorization.js";

// Crypto dependencies
import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import { recoverPublicKey } from "../../../crypto/Secp256k1/recoverPublicKey.js";
import { sign as secp256k1Sign } from "../../../crypto/Secp256k1/sign.js";
import { FromPublicKey } from "../../Address/BrandedAddress/fromPublicKey.js";
import { encode as rlpEncode } from "../../Rlp/BrandedRlp/encode.js";

// Create address factory with crypto dependencies
const addressFromPublicKey = FromPublicKey({ keccak256 });

// Import factory functions
import { Hash } from "./hash.js";
import { Sign } from "./sign.js";
import { Verify } from "./verify.js";

// Import other functions
import { calculateGasCost } from "./calculateGasCost.js";
import {
	MAGIC_BYTE,
	PER_AUTH_BASE_COST,
	PER_EMPTY_ACCOUNT_COST,
	SECP256K1_HALF_N,
	SECP256K1_N,
} from "./constants.js";
import { equals, equalsAuth } from "./equals.js";
import { format } from "./format.js";
import { getGasCost } from "./getGasCost.js";
import { isItem } from "./isItem.js";
import { isUnsigned } from "./isUnsigned.js";
import { process } from "./process.js";
import { processAll } from "./processAll.js";
import { validate } from "./validate.js";

// Export factory functions (tree-shakeable)
export { Hash, Verify, Sign };

// Create wrapped functions with auto-injected crypto
const hash = Hash({ keccak256, rlpEncode });
const verify = Verify({
	keccak256,
	rlpEncode,
	recoverPublicKey,
	addressFromPublicKey,
});
const sign = Sign({
	keccak256,
	rlpEncode,
	sign: secp256k1Sign,
	recoverPublicKey,
	addressFromPublicKey,
});

// Export individual functions
export {
	isItem,
	isUnsigned,
	validate,
	hash,
	sign,
	verify,
	calculateGasCost,
	getGasCost,
	process,
	processAll,
	format,
	equals,
	equalsAuth,
};

// Namespace export
export const BrandedAuthorization = {
	// Factories
	Hash,
	Verify,
	Sign,
	// Wrapped functions
	isItem,
	isUnsigned,
	validate,
	hash,
	sign,
	verify,
	calculateGasCost,
	getGasCost,
	process,
	processAll,
	format,
	equals,
	equalsAuth,
	// Constants
	MAGIC_BYTE,
	PER_AUTH_BASE_COST,
	PER_EMPTY_ACCOUNT_COST,
	SECP256K1_N,
	SECP256K1_HALF_N,
};

// Re-export WASM functions
export * from "./Authorization.wasm.js";
