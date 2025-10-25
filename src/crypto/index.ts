/**
 * Crypto module exports for @tevm/primitives
 * TypeScript wrapper for Zig crypto functions via C FFI
 */

// Keccak-256 (fully implemented)
export { keccak256, keccak256Empty } from "./keccak.ts";

// EIP-191 Personal Message Signing (fully implemented)
export { hashMessage } from "./eip191.ts";

// Hash algorithms (stubs - require C API bindings)
export { sha256, ripemd160, blake2b } from "./hash-algorithms.ts";

// secp256k1 operations (stubs - require C API bindings)
export {
	SECP256K1_P,
	SECP256K1_N,
	SECP256K1_Gx,
	SECP256K1_Gy,
	type Point,
	zero,
	generator,
	isOnCurve,
	negate,
	double,
	add,
	multiply,
	extractRecoveryId,
} from "./secp256k1.ts";

// EIP-712 Typed Data (stubs - require complex encoding)
export {
	type TypedDataDomain,
	type TypedDataField,
	type TypedMessage,
	hashTypedData,
	calculateDomainSeparator,
	hashStruct,
} from "./eip712.ts";
