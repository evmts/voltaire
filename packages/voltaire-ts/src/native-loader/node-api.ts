/**
 * Node-API loader for native bindings.
 * Uses Node.js synchronous `createRequire` addon loading for compatibility.
 */

import { createRequire } from "node:module";
import { resolve } from "node:path";
import * as platformModule from "./platform.js";
import {
	getNativeErrorMessage,
	NativeError,
	NativeLibraryNotFoundError,
} from "./types.js";

/**
 * Native module interface mirroring all C ABI symbols exported by voltaire-zig.
 */
export interface NativeModule {
	// Address operations
	primitives_address_from_hex(hex: string, output: Uint8Array): number;
	primitives_address_to_hex(address: Uint8Array, output: Uint8Array): number;
	primitives_address_to_checksum_hex(
		address: Uint8Array,
		output: Uint8Array,
	): number;
	primitives_address_is_zero(address: Uint8Array): boolean;
	primitives_address_equals(a: Uint8Array, b: Uint8Array): boolean;
	primitives_address_validate_checksum(hex: string): boolean;
	primitives_calculate_create_address(
		sender: Uint8Array,
		nonce: number | bigint,
		output: Uint8Array,
	): number;
	primitives_calculate_create2_address(
		sender: Uint8Array,
		salt: Uint8Array,
		initCode: Uint8Array,
		initCodeLen: number,
		output: Uint8Array,
	): number;

	// Keccak256 & hash utilities
	primitives_keccak256(
		data: Uint8Array,
		length: number,
		output: Uint8Array,
	): number;
	primitives_hash_to_hex(hash: Uint8Array, output: Uint8Array): number;
	primitives_hash_from_hex(hex: string, output: Uint8Array): number;
	primitives_hash_equals(a: Uint8Array, b: Uint8Array): boolean;
	primitives_eip191_hash_message(
		message: Uint8Array,
		length: number,
		output: Uint8Array,
	): number;
	primitives_solidity_keccak256(
		data: Uint8Array,
		length: number,
		output: Uint8Array,
	): number;
	primitives_solidity_sha256(
		data: Uint8Array,
		length: number,
		output: Uint8Array,
	): number;

	// Hash algorithms (SHA256, RIPEMD160, BLAKE2b)
	primitives_sha256(
		data: Uint8Array,
		length: number,
		output: Uint8Array,
	): number;
	primitives_ripemd160(
		data: Uint8Array,
		length: number,
		output: Uint8Array,
	): number;
	primitives_blake2b(
		data: Uint8Array,
		length: number,
		output: Uint8Array,
	): number;
	blake2Hash(
		data: Uint8Array,
		length: number,
		output: Uint8Array,
		outputLength: number,
	): number;

	// Hex & U256 operations
	primitives_hex_to_bytes(
		hex: string,
		output: Uint8Array,
		outputLength: number,
	): number;
	primitives_bytes_to_hex(
		bytes: Uint8Array,
		length: number,
		output: Uint8Array,
		outputLength: number,
	): number;
	primitives_u256_from_hex(hex: string, output: Uint8Array): number;
	primitives_u256_to_hex(
		value: Uint8Array,
		output: Uint8Array,
		outputLength: number,
	): number;

	// secp256k1 & signature utilities
	primitives_secp256k1_recover_pubkey(
		messageHash: Uint8Array,
		r: Uint8Array,
		s: Uint8Array,
		v: number,
		outPubkey: Uint8Array,
	): number;
	primitives_secp256k1_recover_address(
		messageHash: Uint8Array,
		r: Uint8Array,
		s: Uint8Array,
		v: number,
		outAddress: Uint8Array,
	): number;
	primitives_secp256k1_pubkey_from_private(
		privateKey: Uint8Array,
		outPubkey: Uint8Array,
	): number;
	primitives_secp256k1_validate_signature(
		r: Uint8Array,
		s: Uint8Array,
	): boolean;
	secp256k1Sign(
		messageHash: Uint8Array,
		privateKey: Uint8Array,
		outSignature: Uint8Array,
		outRecoveryId: Uint8Array,
	): number;
	secp256k1Verify(
		messageHash: Uint8Array,
		signature: Uint8Array,
		publicKey: Uint8Array,
	): number;
	secp256k1Recover(
		messageHash: Uint8Array,
		signature: Uint8Array,
		recoveryId: number,
		outPublicKey: Uint8Array,
	): number;
	secp256k1DerivePublicKey(privateKey: Uint8Array, output: Uint8Array): number;
	primitives_signature_normalize(r: Uint8Array, s: Uint8Array): boolean;
	primitives_signature_is_canonical(r: Uint8Array, s: Uint8Array): boolean;
	primitives_signature_parse(
		sigData: Uint8Array,
		sigLen: number,
		outR: Uint8Array,
		outS: Uint8Array,
		outV: Uint8Array,
	): number;
	primitives_signature_serialize(
		r: Uint8Array,
		s: Uint8Array,
		v: number,
		includeV: boolean,
		outBuf: Uint8Array,
	): number;
	primitives_generate_private_key(outPrivateKey: Uint8Array): number;
	primitives_compress_public_key(
		uncompressed: Uint8Array,
		outCompressed: Uint8Array,
	): number;

	// P256 (secp256r1) operations
	p256Sign(
		hash: Uint8Array,
		privateKey: Uint8Array,
		outSignature: Uint8Array,
	): number;
	p256Verify(
		hash: Uint8Array,
		signature: Uint8Array,
		publicKey: Uint8Array,
	): number;
	p256DerivePublicKey(privateKey: Uint8Array, outPublicKey: Uint8Array): number;
	p256Ecdh(
		privateKey: Uint8Array,
		publicKey: Uint8Array,
		outShared: Uint8Array,
	): number;

	// Ed25519 operations
	ed25519Sign(
		message: Uint8Array,
		messageLen: number,
		secretKey: Uint8Array,
		outSignature: Uint8Array,
	): number;
	ed25519Verify(
		message: Uint8Array,
		messageLen: number,
		signature: Uint8Array,
		publicKey: Uint8Array,
	): number;
	ed25519DerivePublicKey(
		secretKey: Uint8Array,
		outPublicKey: Uint8Array,
	): number;

	// X25519 operations
	x25519DerivePublicKey(secret: Uint8Array, outPub: Uint8Array): number;
	x25519Scalarmult(
		secret: Uint8Array,
		pub: Uint8Array,
		outShared: Uint8Array,
	): number;
	x25519KeypairFromSeed(
		seed: Uint8Array,
		outSecret: Uint8Array,
		outPub: Uint8Array,
	): number;

	// AES-GCM operations
	aesGcm128Encrypt(
		plaintext: Uint8Array,
		plaintextLen: number,
		key: Uint8Array,
		nonce: Uint8Array,
		ad: Uint8Array,
		adLen: number,
		out: Uint8Array,
	): number;
	aesGcm128Decrypt(
		ciphertext: Uint8Array,
		ciphertextLen: number,
		key: Uint8Array,
		nonce: Uint8Array,
		ad: Uint8Array,
		adLen: number,
		out: Uint8Array,
	): number;
	aesGcm256Encrypt(
		plaintext: Uint8Array,
		plaintextLen: number,
		key: Uint8Array,
		nonce: Uint8Array,
		ad: Uint8Array,
		adLen: number,
		out: Uint8Array,
	): number;
	aesGcm256Decrypt(
		ciphertext: Uint8Array,
		ciphertextLen: number,
		key: Uint8Array,
		nonce: Uint8Array,
		ad: Uint8Array,
		adLen: number,
		out: Uint8Array,
	): number;

	// KZG (EIP-4844) operations
	kzg_load_trusted_setup(): number;
	kzg_load_trusted_setup_bytes(data: Uint8Array, len: number): number;
	kzg_free_trusted_setup(): number;
	kzg_blob_to_commitment(blob: Uint8Array, outCommitment: Uint8Array): number;
	kzg_compute_proof(
		blob: Uint8Array,
		z: Uint8Array,
		outProof: Uint8Array,
		outY: Uint8Array,
	): number;
	kzg_compute_blob_proof(
		blob: Uint8Array,
		commitment: Uint8Array,
		outProof: Uint8Array,
	): number;
	kzg_verify_proof(
		commitment: Uint8Array,
		z: Uint8Array,
		y: Uint8Array,
		proof: Uint8Array,
	): number;
	kzg_verify_blob_proof(
		blob: Uint8Array,
		commitment: Uint8Array,
		proof: Uint8Array,
	): number;

	// BN254 (EIP-196 / EIP-197) operations
	primitives_bn254_ecadd(
		input: Uint8Array,
		inputLen: number,
		outBuf: Uint8Array,
		outLen: number,
	): number;
	primitives_bn254_ecmul(
		input: Uint8Array,
		inputLen: number,
		outBuf: Uint8Array,
		outLen: number,
	): number;
	primitives_bn254_ecpairing(
		input: Uint8Array,
		inputLen: number,
		outBuf: Uint8Array,
		outLen: number,
	): number;

	// ModExp (EIP-198) operations
	primitives_modexp(
		base: Uint8Array,
		baseLen: number,
		exp: Uint8Array,
		expLen: number,
		modulus: Uint8Array,
		modLen: number,
		outBuf: Uint8Array,
		outLen: number,
	): number;

	// BLS12-381 (EIP-2537 via blst) operations
	primitives_bls12_381_g1_add(
		input: Uint8Array,
		inputLen: number,
		outBuf: Uint8Array,
		outLen: number,
	): number;
	primitives_bls12_381_g1_mul(
		input: Uint8Array,
		inputLen: number,
		outBuf: Uint8Array,
		outLen: number,
	): number;
	primitives_bls12_381_g1_msm(
		input: Uint8Array,
		inputLen: number,
		outBuf: Uint8Array,
		outLen: number,
	): number;
	primitives_bls12_381_g2_add(
		input: Uint8Array,
		inputLen: number,
		outBuf: Uint8Array,
		outLen: number,
	): number;
	primitives_bls12_381_g2_mul(
		input: Uint8Array,
		inputLen: number,
		outBuf: Uint8Array,
		outLen: number,
	): number;
	primitives_bls12_381_g2_msm(
		input: Uint8Array,
		inputLen: number,
		outBuf: Uint8Array,
		outLen: number,
	): number;
	primitives_bls12_381_pairing(
		input: Uint8Array,
		inputLen: number,
		outBuf: Uint8Array,
		outLen: number,
	): number;
	primitives_bls12_381_map_fp_to_g1(
		input: Uint8Array,
		inputLen: number,
		outBuf: Uint8Array,
		outLen: number,
	): number;
	primitives_bls12_381_map_fp2_to_g2(
		input: Uint8Array,
		inputLen: number,
		outBuf: Uint8Array,
		outLen: number,
	): number;

	// RLP, Transaction, ABI, Bytecode, Blob, Version operations
	primitives_rlp_encode_bytes(
		data: Uint8Array,
		dataLen: number,
		outBuf: Uint8Array,
		bufLen: number,
	): number;
	primitives_rlp_encode_uint(
		valueBytes: Uint8Array,
		outBuf: Uint8Array,
		bufLen: number,
	): number;
	primitives_rlp_to_hex(
		rlpData: Uint8Array,
		rlpLen: number,
		outBuf: Uint8Array,
		bufLen: number,
	): number;
	primitives_rlp_from_hex(
		hex: string,
		outBuf: Uint8Array,
		bufLen: number,
	): number;
	primitives_tx_detect_type(data: Uint8Array, dataLen: number): number;
	primitives_abi_compute_selector(
		signature: string,
		output: Uint8Array,
	): number;
	primitives_bytecode_analyze_jumpdests(
		code: Uint8Array,
		codeLen: number,
		outJumpdests: Uint8Array,
		maxJumpdests: number,
	): number;
	primitives_bytecode_is_boundary(
		code: Uint8Array,
		codeLen: number,
		position: number,
	): boolean;
	primitives_bytecode_is_valid_jumpdest(
		code: Uint8Array,
		codeLen: number,
		position: number,
	): boolean;
	primitives_bytecode_validate(code: Uint8Array, codeLen: number): number;
	primitives_blob_from_data(
		data: Uint8Array,
		dataLen: number,
		outBlob: Uint8Array,
	): number;
	primitives_blob_to_data(
		blob: Uint8Array,
		outData: Uint8Array,
		outLen: Uint8Array,
	): number;
	primitives_blob_is_valid(blobLen: number): number;
	primitives_version_string(): string | null;

	// HD Wallet operations
	hdwallet_generate_mnemonic(
		entropy: Uint8Array,
		entropyLen: number,
		outMnemonic: Uint8Array,
		outLen: number,
	): number;
	hdwallet_mnemonic_to_seed(
		mnemonic: string,
		passphrase: Uint8Array | null,
		outSeed: Uint8Array,
	): number;
	hdwallet_validate_mnemonic(mnemonic: string): number;
	hdwallet_from_seed(seed: Uint8Array, seedLen: number): number | bigint;
	hdwallet_derive(
		hdkeyHandle: number | bigint,
		path: Uint8Array,
		pathLen: number,
	): number | bigint;
	hdwallet_get_private_key(
		hdkeyHandle: number | bigint,
		outPrivateKey: Uint8Array,
	): number;
	hdwallet_get_public_key(
		hdkeyHandle: number | bigint,
		outPublicKey: Uint8Array,
	): number;
	hdwallet_get_address(
		hdkeyHandle: number | bigint,
		outAddress: Uint8Array,
	): number;
	hdwallet_free(hdkeyHandle: number | bigint): number;

	// StateManager operations
	state_manager_create(): number | null;
	state_manager_create_with_fork(forkBackend: number): number | null;
	state_manager_destroy(handle: number): void;
	state_manager_get_balance_sync(
		handle: number,
		addressHex: string,
		outBuffer: Uint8Array,
		bufferLen: number,
	): number;
	state_manager_get_nonce_sync(
		handle: number,
		addressHex: string,
		outNonce: Uint8Array,
	): number;
	state_manager_get_code_len_sync(
		handle: number,
		addressHex: string,
		outLen: Uint8Array,
	): number;
	state_manager_get_code_sync(
		handle: number,
		addressHex: string,
		outBuffer: Uint8Array,
		bufferLen: number,
	): number;
	state_manager_get_storage_sync(
		handle: number,
		addressHex: string,
		slotHex: string,
		outBuffer: Uint8Array,
		bufferLen: number,
	): number;
	state_manager_set_balance(
		handle: number,
		addressHex: string,
		balanceHex: string,
	): number;
	state_manager_set_nonce(
		handle: number,
		addressHex: string,
		nonce: number,
	): number;
	state_manager_set_code(
		handle: number,
		addressHex: string,
		codePtr: Uint8Array,
		codeLen: number,
	): number;
	state_manager_set_storage(
		handle: number,
		addressHex: string,
		slotHex: string,
		valueHex: string,
	): number;
	state_manager_checkpoint(handle: number): number;
	state_manager_revert(handle: number): void;
	state_manager_commit(handle: number): void;
	state_manager_snapshot(handle: number, outSnapshotId: Uint8Array): number;
	state_manager_revert_to_snapshot(handle: number, snapshotId: number): number;
	state_manager_clear_caches(handle: number): void;
	state_manager_clear_fork_cache(handle: number): void;

	// ForkBackend operations
	fork_backend_create(
		rpcClientPtr: number,
		rpcVtable: number,
		blockTag: string,
		maxCacheSize: number,
	): number | null;
	fork_backend_destroy(handle: number): void;
	fork_backend_clear_cache(handle: number): void;
	fork_backend_next_request(
		handle: number,
		outRequestId: Uint8Array,
		outMethod: Uint8Array,
		methodBufLen: number,
		outMethodLen: Uint8Array,
		outParams: Uint8Array,
		paramsBufLen: number,
		outParamsLen: Uint8Array,
	): number;
	fork_backend_continue(
		handle: number,
		requestId: number,
		responsePtr: Uint8Array,
		responseLen: number,
	): number;

	// Blockchain operations
	blockchain_create(): number | null;
	blockchain_create_with_fork(forkCache: number): number | null;
	blockchain_destroy(handle: number): void;
	blockchain_get_block_by_hash(
		handle: number,
		blockHashPtr: Uint8Array,
		outBlockData: Uint8Array,
	): number;
	blockchain_get_block_by_number(
		handle: number,
		number: number,
		outBlockData: Uint8Array,
	): number;
	blockchain_get_canonical_hash(
		handle: number,
		number: number,
		outHash: Uint8Array,
	): number;
	blockchain_get_head_block_number(
		handle: number,
		outNumber: Uint8Array,
	): number;
	blockchain_put_block(handle: number, blockData: Uint8Array): number;
	blockchain_set_canonical_head(
		handle: number,
		blockHashPtr: Uint8Array,
	): number;
	blockchain_has_block(handle: number, blockHashPtr: Uint8Array): boolean;
	blockchain_local_block_count(handle: number): number | bigint;
	blockchain_orphan_count(handle: number): number | bigint;
	blockchain_canonical_chain_length(handle: number): number | bigint;
	blockchain_is_fork_block(handle: number, number: number): boolean;

	// ForkBlockCache operations
	fork_block_cache_create(
		rpcContext: number,
		vtableFetchByNumber: number,
		vtableFetchByHash: number,
		forkBlockNumber: number,
	): number | null;
	fork_block_cache_destroy(handle: number): void;
	fork_block_cache_next_request(
		handle: number,
		outRequestId: Uint8Array,
		outMethod: Uint8Array,
		methodBufLen: number,
		outMethodLen: Uint8Array,
		outParams: Uint8Array,
		paramsBufLen: number,
		outParamsLen: Uint8Array,
	): number;
	fork_block_cache_continue(
		handle: number,
		requestId: number,
		responsePtr: Uint8Array,
		responseLen: number,
	): number;
}

const nodeRequire = createRequire(import.meta.url);

let nativeModule: NativeModule | null = null;

function resolveCandidatePaths(): string[] {
	if (typeof platformModule.getNativeLibCandidates === "function") {
		return platformModule.getNativeLibCandidates({ runtime: "node-api" });
	}
	return [platformModule.getNativeLibPath("voltaire_native")];
}

function getPlatformLabel(): string {
	if (
		typeof platformModule.isNativeSupported === "function" &&
		platformModule.isNativeSupported()
	) {
		return platformModule.getPlatform();
	}
	return `${process.platform}-${process.arch}`;
}

/**
 * Load native library synchronously using Node.js addon mechanism (`createRequire`).
 * @throws {NativeLibraryNotFoundError} If library cannot be loaded
 */
export function loadNodeNativeSync(): NativeModule {
	if (nativeModule) return nativeModule;

	const pathsToTry = resolveCandidatePaths();
	let lastError: Error | null = null;

	for (const libPath of pathsToTry) {
		try {
			nativeModule = nodeRequire(resolve(libPath)) as NativeModule;
			return nativeModule;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
		}
	}

	throw new NativeLibraryNotFoundError(
		getPlatformLabel(),
		pathsToTry,
		lastError ?? undefined,
	);
}

/**
 * Load native library using Node.js addon mechanism.
 * Alias for {@link loadNodeNativeSync}.
 */
export function loadNodeNative(): NativeModule {
	return loadNodeNativeSync();
}

/**
 * Check if native library is loaded.
 */
export function isLoaded(): boolean {
	return nativeModule !== null;
}

/**
 * Unload native library cached reference.
 */
export function unload(): void {
	nativeModule = null;
}

/**
 * Check error code and throw a typed NativeError if non-zero.
 */
export function checkError(code: number, operation: string): void {
	if (code !== 0) {
		throw new NativeError(
			operation,
			code,
			`Native ${operation} failed: ${getNativeErrorMessage(code)}`,
		);
	}
}

/**
 * Helper to allocate buffer for output.
 */
export function allocateOutput(size: number): Uint8Array {
	return new Uint8Array(size);
}

/**
 * Helper to allocate buffer for string output.
 */
export function allocateStringOutput(size: number): {
	buffer: Uint8Array;
	ptr: Uint8Array;
} {
	const buffer = new Uint8Array(size);
	const ptr = new Uint8Array(8);
	return { buffer, ptr };
}
