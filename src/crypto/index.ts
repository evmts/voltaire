/**
 * Crypto module exports for @tevm/primitives
 * TypeScript wrapper for Zig crypto functions via C FFI
 */

// Keccak-256 (fully implemented)
export { keccak256, keccak256Empty } from "./keccak.js";

// EIP-191 Personal Message Signing (hash implemented, sign/verify require C API)
export {
	hashMessage,
	signMessage,
	verifyMessage,
	recoverMessageAddress,
	type Hex as Eip191Hex,
	type Address as Eip191Address,
	type Signature as Eip191Signature,
} from "./eip191.js";

// Hash algorithms (stubs - require C API bindings)
export { sha256, ripemd160, blake2b } from "./hash-algorithms.js";

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
} from "./secp256k1.js";

// EIP-712 Typed Data (hash implemented, sign/verify require C API)
export {
	type TypedDataDomain,
	type TypedDataField,
	type TypedData,
	hashTypedData,
	hashDomain,
	signTypedData,
	verifyTypedData,
	recoverTypedDataAddress,
	type Hex as Eip712Hex,
	type Address as Eip712Address,
	type Signature as Eip712Signature,
} from "./eip712.js";
