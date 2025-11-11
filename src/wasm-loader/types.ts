/**
 * Type definitions for WebAssembly FFI layer.
 * Defines all WASM exports and memory management types.
 *
 * @see https://voltaire.tevm.sh/getting-started for documentation
 * @since 0.0.0
 */

/**
 * Error codes returned by WASM functions.
 *
 * @see https://voltaire.tevm.sh/getting-started for documentation
 * @since 0.0.0
 * @example
 * ```typescript
 * import { ErrorCode } from './wasm-loader/types.js';
 * if (result === ErrorCode.INVALID_HEX) {
 *   console.error('Invalid hex string');
 * }
 * ```
 */
export enum ErrorCode {
	SUCCESS = 0,
	INVALID_HEX = -1,
	INVALID_LENGTH = -2,
	INVALID_CHECKSUM = -3,
	OUT_OF_MEMORY = -4,
	INVALID_INPUT = -5,
	INVALID_SIGNATURE = -6,
	INVALID_SELECTOR = -7,
	UNSUPPORTED_TYPE = -8,
	MAX_LENGTH_EXCEEDED = -9,
	ACCESS_LIST_INVALID = -10,
	AUTHORIZATION_INVALID = -11,
}

/**
 * Complete interface for all WASM exported functions.
 *
 * @see https://voltaire.tevm.sh/getting-started for documentation
 * @since 0.0.0
 * @example
 * ```typescript
 * import type { WasmExports } from './wasm-loader/types.js';
 * import { getExports } from './wasm-loader/loader.js';
 * const exports: WasmExports = getExports();
 * ```
 */
export interface WasmExports {
	[key: string]: unknown;

	// Memory export
	memory: WebAssembly.Memory;

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
		nonce: bigint,
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
	primitives_sha256: (
		dataPtr: number,
		dataLen: number,
		outPtr: number,
	) => number;
	primitives_ripemd160: (
		dataPtr: number,
		dataLen: number,
		outPtr: number,
	) => number;
	primitives_blake2b: (
		dataPtr: number,
		dataLen: number,
		outPtr: number,
	) => number;
	// Individual crypto WASM modules
	blake2Hash?: (
		inputPtr: number,
		inputLen: number,
		outputPtr: number,
		outputLen: number,
	) => number;
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
	primitives_bytecode_get_next_pc: (
		codePtr: number,
		codeLen: number,
		currentPc: number,
	) => number;
	primitives_bytecode_scan: (
		codePtr: number,
		codeLen: number,
		startPc: number,
		endPc: number,
		outPtr: number,
		outLenPtr: number,
	) => number;
	primitives_bytecode_detect_fusions: (
		codePtr: number,
		codeLen: number,
		outPtr: number,
		outLenPtr: number,
	) => number;

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

	// WASM-specific secp256k1 functions
	secp256k1Sign: (
		msgHashPtr: number,
		privKeyPtr: number,
		sigPtr: number,
		recidPtr: number,
	) => number;
	secp256k1Verify: (
		msgHashPtr: number,
		sigPtr: number,
		pubKeyPtr: number,
	) => number;
	secp256k1Recover: (
		msgHashPtr: number,
		sigPtr: number,
		recid: number,
		pubKeyPtr: number,
	) => number;
	secp256k1DerivePublicKey: (privKeyPtr: number, pubKeyPtr: number) => number;

	// X25519 functions
	x25519DerivePublicKey: (secretPtr: number, pubPtr: number) => number;
	x25519Scalarmult: (
		secretPtr: number,
		pubPtr: number,
		sharedPtr: number,
	) => number;
	x25519KeypairFromSeed: (
		seedPtr: number,
		secretPtr: number,
		pubPtr: number,
	) => number;

	// Ed25519 functions
	ed25519Sign: (
		msgPtr: number,
		msgLen: number,
		secretPtr: number,
		sigPtr: number,
	) => number;
	ed25519Verify: (
		msgPtr: number,
		msgLen: number,
		sigPtr: number,
		pubPtr: number,
	) => number;
	ed25519DerivePublicKey: (secretPtr: number, pubPtr: number) => number;
	ed25519KeypairFromSeed: (
		seedPtr: number,
		secretPtr: number,
		pubPtr: number,
	) => number;

	// P256 functions
	p256Sign: (msgHashPtr: number, privKeyPtr: number, sigPtr: number) => number;
	p256Verify: (msgHashPtr: number, sigPtr: number, pubKeyPtr: number) => number;
	p256DerivePublicKey: (privKeyPtr: number, pubKeyPtr: number) => number;
	p256Ecdh: (
		privKeyPtr: number,
		pubKeyPtr: number,
		sharedPtr: number,
	) => number;

	// ABI functions
	primitives_abi_compute_selector: (
		signaturePtr: number,
		outPtr: number,
	) => number;
	primitives_abi_encode_parameters: (
		typesJsonPtr: number,
		valuesJsonPtr: number,
		outPtr: number,
		outLen: number,
	) => number;
	primitives_abi_decode_parameters: (
		dataPtr: number,
		dataLen: number,
		typesJsonPtr: number,
		outPtr: number,
		outLen: number,
	) => number;

	// Blob functions (EIP-4844)
	primitives_blob_from_data: (
		dataPtr: number,
		dataLen: number,
		outPtr: number,
	) => number;
	primitives_blob_to_data: (
		blobPtr: number,
		outPtr: number,
		outLenPtr: number,
	) => number;
	primitives_blob_is_valid: (blobLen: number) => number;
	primitives_blob_calculate_gas: (blobCount: number) => bigint;
	primitives_blob_estimate_count: (dataSize: number) => number;
	primitives_blob_calculate_gas_price: (excessBlobGas: bigint) => bigint;
	primitives_blob_calculate_excess_gas: (
		parentExcess: bigint,
		parentUsed: bigint,
	) => bigint;

	// Event log functions
	primitives_eventlog_matches_address: (
		logAddressPtr: number,
		filterAddressesPtr: number,
		filterCount: number,
	) => number;
	primitives_eventlog_matches_topic: (
		logTopicPtr: number,
		filterTopicPtr: number,
		nullTopic: number,
	) => number;
	primitives_eventlog_matches_topics: (
		logTopicsPtr: number,
		logTopicCount: number,
		filterTopicsPtr: number,
		filterNullsPtr: number,
		filterCount: number,
	) => number;

	// Access List functions (EIP-2930)
	primitives_access_list_gas_cost: (
		jsonPtr: number,
		outCostPtr: number,
	) => number;
	primitives_access_list_gas_savings: (
		jsonPtr: number,
		outSavingsPtr: number,
	) => number;
	primitives_access_list_includes_address: (
		jsonPtr: number,
		addressPtr: number,
	) => number;
	primitives_access_list_includes_storage_key: (
		jsonPtr: number,
		addressPtr: number,
		keyPtr: number,
	) => number;

	// Authorization functions (EIP-7702)
	primitives_authorization_validate: (authPtr: number) => number;
	primitives_authorization_signing_hash: (
		chainId: bigint,
		addressPtr: number,
		nonce: bigint,
		outHashPtr: number,
	) => number;
	primitives_authorization_authority: (
		authPtr: number,
		outAddressPtr: number,
	) => number;
	primitives_authorization_gas_cost: (
		count: number,
		emptyAccounts: number,
	) => bigint;
}

/**
 * WASI imports for wasm32-wasi modules.
 *
 * @see https://voltaire.tevm.sh/getting-started for documentation
 * @since 0.0.0
 * @example
 * ```typescript
 * import type { WasiImports } from './wasm-loader/types.js';
 * const wasi: WasiImports = {
 *   args_get: () => 0,
 *   // ... other WASI functions
 * };
 * ```
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
