// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";
export * from "./types.js";
export * from "./BrandedAuthorization.js";

// Import all functions
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
import { hash } from "./hash.js";
import { isItem } from "./isItem.js";
import { isUnsigned } from "./isUnsigned.js";
import { process } from "./process.js";
import { processAll } from "./processAll.js";
import { sign } from "./sign.js";
import { validate } from "./validate.js";
import { verify } from "./verify.js";

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
	MAGIC_BYTE,
	PER_AUTH_BASE_COST,
	PER_EMPTY_ACCOUNT_COST,
	SECP256K1_N,
	SECP256K1_HALF_N,
};

// Re-export WASM functions
export * from "./Authorization.wasm.js";
