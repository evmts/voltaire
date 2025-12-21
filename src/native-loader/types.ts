/**
 * TypeScript type definitions for native FFI bindings
 * Mirrors c_api.zig exports
 */

import type { FFIType } from "bun:ffi";

/**
 * Common FFI function signatures for c_api.zig exports
 */
export interface NativeExports {
	// Address operations
	primitives_address_from_hex: {
		args: [FFIType.cstring, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_address_to_hex: {
		args: [FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_address_to_checksum_hex: {
		args: [FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_address_is_zero: {
		args: [FFIType.ptr];
		returns: FFIType.bool;
	};
	primitives_address_equals: {
		args: [FFIType.ptr, FFIType.ptr];
		returns: FFIType.bool;
	};

	// Keccak256 operations
	primitives_keccak256: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr];
		returns: FFIType.i32;
	};

	// Hash operations
	primitives_hash_to_hex: {
		args: [FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_hash_from_hex: {
		args: [FFIType.cstring, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_hash_equals: {
		args: [FFIType.ptr, FFIType.ptr];
		returns: FFIType.bool;
	};

	// Hex operations
	primitives_hex_to_bytes: {
		args: [FFIType.cstring, FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_bytes_to_hex: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};

	// U256 operations
	primitives_u256_from_hex: {
		args: [FFIType.cstring, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_u256_to_hex: {
		args: [FFIType.ptr, FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};

	// EIP-191 operations
	primitives_eip191_hash_message: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr];
		returns: FFIType.i32;
	};

	// Address calculation
	primitives_calculate_create_address: {
		args: [FFIType.ptr, FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_calculate_create2_address: {
		args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};

	// secp256k1 operations
	primitives_secp256k1_recover_pubkey: {
		args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_secp256k1_recover_address: {
		args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_secp256k1_pubkey_from_private: {
		args: [FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_secp256k1_validate_signature: {
		args: [FFIType.ptr, FFIType.ptr, FFIType.ptr];
		returns: FFIType.bool;
	};
	secp256k1Sign: {
		args: [FFIType.ptr, FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};
	secp256k1Verify: {
		args: [FFIType.ptr, FFIType.ptr, FFIType.ptr];
		returns: FFIType.bool;
	};
	secp256k1Recover: {
		args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};
	secp256k1DerivePublicKey: {
		args: [FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};

	// Hash functions
	primitives_sha256: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_ripemd160: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_blake2b: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr];
		returns: FFIType.i32;
	};

	// RLP operations
	primitives_rlp_encode_bytes: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_rlp_encode_uint: {
		args: [FFIType.ptr, FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_rlp_to_hex: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_rlp_from_hex: {
		args: [FFIType.cstring, FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};

	// Signature operations
	primitives_signature_normalize: {
		args: [FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_signature_is_canonical: {
		args: [FFIType.ptr];
		returns: FFIType.bool;
	};
	primitives_signature_parse: {
		args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_signature_serialize: {
		args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr];
		returns: FFIType.i32;
	};

	// Cryptographic key generation
	primitives_generate_private_key: {
		args: [FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_compress_public_key: {
		args: [FFIType.ptr, FFIType.ptr];
		returns: FFIType.i32;
	};

	// Solidity-compatible hash functions
	primitives_solidity_keccak256: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr];
		returns: FFIType.i32;
	};
	primitives_solidity_sha256: {
		args: [FFIType.ptr, FFIType.u64, FFIType.ptr];
		returns: FFIType.i32;
	};

	// ABI operations
	primitives_abi_compute_selector: {
		args: [FFIType.cstring, FFIType.ptr];
		returns: FFIType.i32;
	};
}

/**
 * Runtime error codes from native library
 */
export enum NativeErrorCode {
	SUCCESS = 0,
	INVALID_HEX = -1,
	INVALID_LENGTH = -2,
	INVALID_CHECKSUM = -3,
	BUFFER_TOO_SMALL = -4,
	INVALID_SIGNATURE = -5,
	INVALID_RECOVERY_ID = -6,
	INVALID_PRIVATE_KEY = -7,
	INVALID_PUBLIC_KEY = -8,
	ENCODING_ERROR = -9,
	DECODING_ERROR = -10,
	NULL_POINTER = -11,
	OUT_OF_MEMORY = -12,
	UNKNOWN_ERROR = -99,
}

/**
 * Convert native error code to error message
 */
export function getNativeErrorMessage(code: number): string {
	switch (code) {
		case NativeErrorCode.SUCCESS:
			return "Success";
		case NativeErrorCode.INVALID_HEX:
			return "Invalid hexadecimal string";
		case NativeErrorCode.INVALID_LENGTH:
			return "Invalid length";
		case NativeErrorCode.INVALID_CHECKSUM:
			return "Invalid checksum";
		case NativeErrorCode.BUFFER_TOO_SMALL:
			return "Buffer too small";
		case NativeErrorCode.INVALID_SIGNATURE:
			return "Invalid signature";
		case NativeErrorCode.INVALID_RECOVERY_ID:
			return "Invalid recovery ID";
		case NativeErrorCode.INVALID_PRIVATE_KEY:
			return "Invalid private key";
		case NativeErrorCode.INVALID_PUBLIC_KEY:
			return "Invalid public key";
		case NativeErrorCode.ENCODING_ERROR:
			return "Encoding error";
		case NativeErrorCode.DECODING_ERROR:
			return "Decoding error";
		case NativeErrorCode.NULL_POINTER:
			return "Null pointer";
		case NativeErrorCode.OUT_OF_MEMORY:
			return "Out of memory";
		case NativeErrorCode.UNKNOWN_ERROR:
			return "Unknown error";
		default:
			return `Native error code: ${code}`;
	}
}
