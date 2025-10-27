/**
 * Type definitions for WebAssembly FFI layer
 * Defines all WASM exports and memory management types
 */

/**
 * Error codes returned by WASM functions
 */
export const enum ErrorCode {
	SUCCESS = 0,
	INVALID_HEX = -1,
	INVALID_LENGTH = -2,
	INVALID_CHECKSUM = -3,
	OUT_OF_MEMORY = -4,
	INVALID_INPUT = -5,
	INVALID_SIGNATURE = -6,
}

/**
 * Complete interface for all WASM exported functions
 */
export interface WasmExports {
	[key: string]: unknown;

	// Address functions
	primitives_address_from_hex: (hexPtr: number, outPtr: number) => number;
	primitives_address_to_hex: (addrPtr: number, outPtr: number) => number;
	primitives_address_to_checksum_hex: (
		addrPtr: number,
		outPtr: number,
	) => number;
	primitives_address_is_zero: (addrPtr: number) => number;
	primitives_address_equals: (aPtr: number, bPtr: number) => number;
	primitives_address_validate_checksum: (hexPtr: number) => number;
	primitives_calculate_create_address: (
		senderPtr: number,
		nonce: number,
		outPtr: number,
	) => number;
	primitives_calculate_create2_address: (
		senderPtr: number,
		saltPtr: number,
		codePtr: number,
		codeLen: number,
		outPtr: number,
	) => number;

	// Hash functions
	primitives_keccak256: (
		dataPtr: number,
		dataLen: number,
		outPtr: number,
	) => number;
	primitives_hash_to_hex: (hashPtr: number, outPtr: number) => number;
	primitives_hash_from_hex: (hexPtr: number, outPtr: number) => number;
	primitives_hash_equals: (aPtr: number, bPtr: number) => number;
	primitives_eip191_hash_message: (
		msgPtr: number,
		msgLen: number,
		outPtr: number,
	) => number;

	// Hash algorithm functions
	primitives_sha256: (dataPtr: number, dataLen: number, outPtr: number) => number;
	primitives_ripemd160: (dataPtr: number, dataLen: number, outPtr: number) => number;
	primitives_blake2b: (dataPtr: number, dataLen: number, outPtr: number) => number;
	primitives_solidity_keccak256: (
		dataPtr: number,
		dataLen: number,
		outPtr: number,
	) => number;
	primitives_solidity_sha256: (
		dataPtr: number,
		dataLen: number,
		outPtr: number,
	) => number;

	// RLP functions
	primitives_rlp_encode_bytes: (
		dataPtr: number,
		dataLen: number,
		outPtr: number,
		outLen: number,
	) => number;
	primitives_rlp_encode_uint: (
		valuePtr: number,
		outPtr: number,
		outLen: number,
	) => number;
	primitives_rlp_to_hex: (
		dataPtr: number,
		dataLen: number,
		outPtr: number,
		outLen: number,
	) => number;
	primitives_rlp_from_hex: (
		hexPtr: number,
		outPtr: number,
		outLen: number,
	) => number;

	// Bytecode functions
	primitives_bytecode_analyze_jumpdests: (
		codePtr: number,
		codeLen: number,
		outPtr: number,
		maxJumpdests: number,
	) => number;
	primitives_bytecode_is_boundary: (
		codePtr: number,
		codeLen: number,
		position: number,
	) => number;
	primitives_bytecode_is_valid_jumpdest: (
		codePtr: number,
		codeLen: number,
		position: number,
	) => number;
	primitives_bytecode_validate: (codePtr: number, codeLen: number) => number;

	// U256 functions
	primitives_u256_from_hex: (hexPtr: number, outPtr: number) => number;
	primitives_u256_to_hex: (
		valuePtr: number,
		outPtr: number,
		outLen: number,
	) => number;

	// Hex functions
	primitives_hex_to_bytes: (
		hexPtr: number,
		outPtr: number,
		outLen: number,
	) => number;
	primitives_bytes_to_hex: (
		dataPtr: number,
		dataLen: number,
		outPtr: number,
		outLen: number,
	) => number;

	// Transaction functions
	primitives_tx_detect_type: (dataPtr: number, dataLen: number) => number;

	// Wallet functions
	primitives_generate_private_key: (outPtr: number) => number;
	primitives_compress_public_key: (
		uncompressedPtr: number,
		outPtr: number,
	) => number;

	// Signature functions (secp256k1)
	primitives_secp256k1_recover_pubkey: (
		hashPtr: number,
		rPtr: number,
		sPtr: number,
		v: number,
		outPtr: number,
	) => number;
	primitives_secp256k1_recover_address: (
		hashPtr: number,
		rPtr: number,
		sPtr: number,
		v: number,
		outPtr: number,
	) => number;
	primitives_secp256k1_pubkey_from_private: (
		keyPtr: number,
		outPtr: number,
	) => number;
	primitives_secp256k1_validate_signature: (
		rPtr: number,
		sPtr: number,
	) => number;
	primitives_signature_normalize: (rPtr: number, sPtr: number) => void;
	primitives_signature_is_canonical: (rPtr: number, sPtr: number) => number;
	primitives_signature_parse: (
		sigPtr: number,
		sigLen: number,
		rPtr: number,
		sPtr: number,
		vPtr: number,
	) => number;
	primitives_signature_serialize: (
		rPtr: number,
		sPtr: number,
		v: number,
		includeV: number,
		outPtr: number,
	) => number;
}

/**
 * WASI imports for wasm32-wasi modules
 */
export interface WasiImports {
	[key: string]: (...args: number[]) => number | never;
	args_get: (argv: number, argv_buf: number) => number;
	args_sizes_get: (argc_ptr: number, argv_buf_size_ptr: number) => number;
	environ_get: (environ: number, environ_buf: number) => number;
	environ_sizes_get: (
		environ_count_ptr: number,
		environ_buf_size_ptr: number,
	) => number;
	fd_write: (
		fd: number,
		iovs: number,
		iovs_len: number,
		nwritten: number,
	) => number;
	fd_fdstat_get: () => number;
	fd_filestat_get: () => number;
	fd_seek: () => number;
	fd_close: () => number;
	fd_read: (
		fd: number,
		iovs: number,
		iovs_len: number,
		nread: number,
	) => number;
	fd_pread: (
		fd: number,
		iovs: number,
		iovs_len: number,
		offset: number,
		nread: number,
	) => number;
	fd_pwrite: (
		fd: number,
		iovs: number,
		iovs_len: number,
		offset: number,
		nwritten: number,
	) => number;
	clock_time_get: () => number;
	random_get: (buf: number, len: number) => number;
	proc_exit: (code: number) => never;
	sched_yield: () => number;
	poll_oneoff: () => number;
	path_filestat_get: () => number;
	path_open: () => number;
	path_readlink: () => number;
	fd_prestat_get: () => number;
	fd_prestat_dir_name: () => number;
	fd_datasync: () => number;
	fd_sync: () => number;
}
