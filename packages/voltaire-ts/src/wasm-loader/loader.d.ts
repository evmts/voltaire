/**
 * WebAssembly module loader for Ethereum primitives.
 * Type declarations for loader.js.
 *
 * @see https://voltaire.tevm.sh/getting-started for documentation
 * @since 0.0.0
 */

import type { Secp256k1PublicKeyType } from "../crypto/Secp256k1/Secp256k1PublicKeyType.js";
import type { AddressType as BrandedAddress } from "../primitives/Address/AddressType.js";
import type { HashType } from "../primitives/Hash/HashType.js";
import type { PrivateKeyType } from "../primitives/PrivateKey/PrivateKeyType.js";

/**
 * Load and instantiate the WASM module.
 *
 * @see https://voltaire.tevm.sh/getting-started for documentation
 * @since 0.0.0
 * @param wasmPath - Path to WASM file, URL, or ArrayBuffer
 * @returns Promise that resolves when WASM is loaded
 * @throws {Error} If WASM module does not export memory or instantiation fails
 * @example
 * ```typescript
 * import { loadWasm } from './wasm-loader/loader.js';
 * await loadWasm('./wasm/primitives.wasm');
 * ```
 */
export function loadWasm(
	wasmPath: string | URL | ArrayBuffer,
	forceReload?: boolean,
): Promise<void>;

/**
 * Get the WASM exports for direct access if needed.
 *
 * @see https://voltaire.tevm.sh/getting-started for documentation
 * @since 0.0.0
 * @returns WASM exports
 * @throws {Error} If WASM module not loaded
 * @example
 * ```typescript
 * import { loadWasm, getExports } from './wasm-loader/loader.js';
 * await loadWasm('./wasm/primitives.wasm');
 * const exports = getExports();
 * ```
 */
export function getExports(): WebAssembly.Exports;

/**
 * Reset memory allocator to free allocated memory.
 *
 * @returns void
 */
export function resetMemory(): void;

// ============================================================================
// Address API
// ============================================================================

/**
 * Create address from hex string
 * @param hex - Hex string (with or without 0x prefix)
 * @returns 20-byte address
 */
export function addressFromHex(hex: string): BrandedAddress;

/**
 * Convert address to hex string
 * @param address - 20-byte address
 * @returns Hex string with 0x prefix
 */
export function addressToHex(address: Uint8Array): string;

/**
 * Convert address to checksummed hex (EIP-55)
 * @param address - 20-byte address
 * @returns Checksummed hex string
 */
export function addressToChecksumHex(address: Uint8Array): string;

/**
 * Check if address is zero address
 * @param address - 20-byte address
 * @returns True if zero address
 */
export function addressIsZero(address: Uint8Array): boolean;

/**
 * Compare two addresses for equality
 * @param a - First address
 * @param b - Second address
 * @returns True if equal
 */
export function addressEquals(a: Uint8Array, b: Uint8Array): boolean;

/**
 * Validate EIP-55 checksum
 * @param hex - Hex string to validate
 * @returns True if checksum is valid
 */
export function addressValidateChecksum(hex: string): boolean;

/**
 * Calculate CREATE contract address
 * @param sender - Sender address (20 bytes)
 * @param nonce - Nonce
 * @returns Contract address (20 bytes)
 */
export function calculateCreateAddress(
	sender: Uint8Array,
	nonce: number | bigint,
): BrandedAddress;

/**
 * Calculate CREATE2 contract address
 * @param sender - Sender address (20 bytes)
 * @param salt - Salt (32 bytes)
 * @param initCode - Init code
 * @returns Contract address (20 bytes)
 */
export function calculateCreate2Address(
	sender: Uint8Array,
	salt: Uint8Array,
	initCode: Uint8Array,
): BrandedAddress;

// ============================================================================
// Keccak-256 API
// ============================================================================

/**
 * Compute Keccak-256 hash
 * @param data - Input data
 * @returns 32-byte hash
 */
export function keccak256(data: Uint8Array): HashType;

/**
 * Convert hash to hex string
 * @param hash - 32-byte hash
 * @returns Hex string with 0x prefix
 */
export function hashToHex(hash: Uint8Array): string;

/**
 * Create hash from hex string
 * @param hex - Hex string (with or without 0x prefix)
 * @returns 32-byte hash
 */
export function hashFromHex(hex: string): HashType;

/**
 * Compare two hashes for equality (constant-time)
 * @param a - First hash
 * @param b - Second hash
 * @returns True if equal
 */
export function hashEquals(a: Uint8Array, b: Uint8Array): boolean;

/**
 * Hash message using EIP-191 format
 * @param message - Message to hash
 * @returns 32-byte hash
 */
export function eip191HashMessage(message: Uint8Array): HashType;

// ============================================================================
// Hash Algorithms API
// ============================================================================

/**
 * Compute SHA-256 hash
 * @param data - Input data
 * @returns 32-byte hash
 */
export function sha256(data: Uint8Array): Uint8Array;

/**
 * Compute RIPEMD-160 hash
 * @param data - Input data
 * @returns 20-byte hash
 */
export function ripemd160(data: Uint8Array): Uint8Array;

/**
 * Compute BLAKE2b hash
 * @param data - Input data
 * @returns 64-byte hash
 */
export function blake2b(data: Uint8Array): Uint8Array;

/**
 * Compute BLAKE2b hash with variable output length
 * @param data - Input data
 * @param outputLength - Output length in bytes (1-64)
 * @returns BLAKE2b hash of specified length
 */
export function blake2Hash(data: Uint8Array, outputLength: number): Uint8Array;

/**
 * Compute Solidity-style Keccak-256 hash of tightly packed data
 * @param packedData - Pre-packed data bytes
 * @returns 32-byte hash
 */
export function solidityKeccak256(packedData: Uint8Array): Uint8Array;

/**
 * Compute Solidity-style SHA-256 hash of tightly packed data
 * @param packedData - Pre-packed data bytes
 * @returns 32-byte hash
 */
export function soliditySha256(packedData: Uint8Array): Uint8Array;

// ============================================================================
// RLP API
// ============================================================================

/**
 * Encode bytes as RLP
 * @param data - Data to encode
 * @returns RLP-encoded data
 */
export function rlpEncodeBytes(data: Uint8Array): Uint8Array;

/**
 * Encode unsigned integer as RLP
 * @param value - 32-byte big-endian u256
 * @returns RLP-encoded data
 */
export function rlpEncodeUint(value: Uint8Array): Uint8Array;

/**
 * Convert RLP bytes to hex string
 * @param rlpData - RLP-encoded data
 * @returns Hex string with 0x prefix
 */
export function rlpToHex(rlpData: Uint8Array): string;

/**
 * Convert hex string to RLP bytes
 * @param hex - Hex string (with or without 0x prefix)
 * @returns RLP bytes
 */
export function rlpFromHex(hex: string): Uint8Array;

// ============================================================================
// Bytecode API
// ============================================================================

/**
 * Analyze bytecode to find JUMPDEST locations
 * @param code - EVM bytecode
 * @returns Array of JUMPDEST positions
 */
export function bytecodeAnalyzeJumpdests(code: Uint8Array): number[];

/**
 * Check if position is at bytecode boundary
 * @param code - EVM bytecode
 * @param position - Position to check
 * @returns True if at boundary
 */
export function bytecodeIsBoundary(code: Uint8Array, position: number): boolean;

/**
 * Check if position is a valid JUMPDEST
 * @param code - EVM bytecode
 * @param position - Position to check
 * @returns True if valid JUMPDEST
 */
export function bytecodeIsValidJumpdest(
	code: Uint8Array,
	position: number,
): boolean;

/**
 * Validate bytecode for basic correctness
 * @param code - EVM bytecode
 * @throws Error if bytecode is invalid
 */
export function bytecodeValidate(code: Uint8Array): void;

/**
 * Get next program counter after current instruction
 * @param code - EVM bytecode
 * @param currentPc - Current program counter
 * @returns Next PC or undefined if at end of bytecode
 */
export function bytecodeGetNextPc(
	code: Uint8Array,
	currentPc: number,
): number | undefined;

/**
 * Instruction data structure (mirrors Zig packed struct)
 */
export interface Instruction {
	pc: number;
	opcode: number;
	pushSize: number;
}

/**
 * Scan bytecode and collect all instructions in range
 * @param code - EVM bytecode
 * @param startPc - Start program counter
 * @param endPc - End program counter (exclusive)
 * @returns Array of instructions
 */
export function bytecodeScan(
	code: Uint8Array,
	startPc: number,
	endPc: number,
): Instruction[];

/**
 * Fusion pattern data structure
 */
export interface FusionPattern {
	pc: number;
	patternType: number; // 1 = PUSH+OP, 2 = DUP+OP, etc.
	firstOpcode: number;
	secondOpcode: number;
}

/**
 * Detect instruction fusion patterns (optimizable sequences)
 * @param code - EVM bytecode
 * @returns Array of detected fusion patterns
 */
export function bytecodeDetectFusions(code: Uint8Array): FusionPattern[];

// ============================================================================
// U256 API
// ============================================================================

/**
 * Convert hex string to U256 (32-byte big-endian)
 * @param hex - Hex string (with or without 0x prefix)
 * @returns 32-byte U256 value
 */
export function u256FromHex(hex: string): Uint8Array;

/**
 * Convert U256 to hex string
 * @param value - 32-byte U256 value (big-endian)
 * @returns Hex string with 0x prefix (66 chars)
 */
export function u256ToHex(value: Uint8Array): string;

// ============================================================================
// Hex API
// ============================================================================

/**
 * Convert hex string to bytes
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Raw bytes
 */
export function hexToBytes(hex: string): Uint8Array;

/**
 * Convert bytes to hex string
 * @param data - Raw bytes
 * @returns Hex string with 0x prefix
 */
export function bytesToHex(data: Uint8Array): string;

// ============================================================================
// Transaction API
// ============================================================================

/**
 * Detect transaction type from serialized data
 * @param data - RLP-encoded transaction data
 * @returns Transaction type (0=Legacy, 1=EIP2930, 2=EIP1559, 3=EIP4844, 4=EIP7702)
 */
export function txDetectType(data: Uint8Array): number;

// ============================================================================
// Wallet API
// ============================================================================

/**
 * Generate a cryptographically secure random private key
 * @returns 32-byte private key
 */
export function generatePrivateKey(): PrivateKeyType;

/**
 * Compress uncompressed secp256k1 public key
 * @param uncompressed - 64-byte uncompressed public key (x, y coordinates)
 * @returns 33-byte compressed public key (0x02/0x03 prefix + x coordinate)
 */
export function compressPublicKey(uncompressed: Uint8Array): Uint8Array;

// ============================================================================
// Signature API (secp256k1)
// ============================================================================

/**
 * Sign message hash with private key using secp256k1.
 *
 * @param messageHash - 32-byte message hash
 * @param privateKey - 32-byte private key
 * @returns Object with r (32 bytes), s (32 bytes), and v (recovery ID 0-1)
 */
export function secp256k1Sign(
	messageHash: Uint8Array,
	privateKey: Uint8Array,
): { r: Uint8Array; s: Uint8Array; v: number };

/**
 * Verify ECDSA signature
 * @param messageHash - 32-byte message hash
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @param publicKey - Uncompressed public key (64 bytes)
 * @returns True if signature is valid
 */
export function secp256k1Verify(
	messageHash: Uint8Array,
	r: Uint8Array,
	s: Uint8Array,
	publicKey: Uint8Array,
): boolean;

/**
 * Recover public key from ECDSA signature
 * @param messageHash - 32-byte message hash
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @param v - Recovery parameter (0-3)
 * @returns Uncompressed public key (64 bytes)
 */
export function secp256k1RecoverPubkey(
	messageHash: Uint8Array,
	r: Uint8Array,
	s: Uint8Array,
	v: number,
): Secp256k1PublicKeyType;

/**
 * Recover Ethereum address from ECDSA signature
 * @param messageHash - 32-byte message hash
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @param v - Recovery parameter (0-3)
 * @returns Ethereum address (20 bytes)
 */
export function secp256k1RecoverAddress(
	messageHash: Uint8Array,
	r: Uint8Array,
	s: Uint8Array,
	v: number,
): BrandedAddress;

/**
 * Derive public key from private key
 * @param privateKey - 32-byte private key
 * @returns Uncompressed public key (64 bytes)
 */
export function secp256k1PubkeyFromPrivate(
	privateKey: Uint8Array,
): Secp256k1PublicKeyType;

/**
 * Validate ECDSA signature components
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @returns True if signature is valid
 */
export function secp256k1ValidateSignature(
	r: Uint8Array,
	s: Uint8Array,
): boolean;

/**
 * Normalize signature to canonical form (low-s)
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @returns Normalized [r, s] components
 */
export function signatureNormalize(
	r: Uint8Array,
	s: Uint8Array,
): [Uint8Array, Uint8Array];

/**
 * Check if signature is in canonical form
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @returns True if signature is canonical
 */
export function signatureIsCanonical(r: Uint8Array, s: Uint8Array): boolean;

/**
 * Parse signature from compact format
 * @param sigData - Signature bytes (64 or 65 bytes)
 * @returns [r, s, v] components
 */
export function signatureParse(
	sigData: Uint8Array,
): [Uint8Array, Uint8Array, Uint8Array];

/**
 * Serialize signature to compact format
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @param v - Recovery parameter
 * @param includeV - Whether to include v byte
 * @returns Serialized signature
 */
export function signatureSerialize(
	r: Uint8Array,
	s: Uint8Array,
	v: number,
	includeV: boolean,
): Uint8Array;

// ============================================================================
// ABI API
// ============================================================================

/**
 * Compute function selector from signature.
 *
 * @param signature - Function signature string (e.g., "transfer(address,uint256)")
 * @returns 4-byte selector
 */
export function abiComputeSelector(signature: string): Uint8Array;

/**
 * Encode ABI parameters
 * @param types - Array of parameter types
 * @param values - Array of parameter values (formatted as strings)
 * @returns Encoded bytes
 */
export function abiEncodeParameters(
	types: readonly string[],
	values: readonly string[],
): Uint8Array;

/**
 * Decode ABI parameters
 * @param data - Encoded data
 * @param types - Array of parameter types
 * @returns Decoded values
 */
export function abiDecodeParameters(
	data: Uint8Array,
	types: readonly string[],
): unknown[];

/**
 * Encode function data (selector + parameters)
 * @param signature - Function signature string (e.g., "transfer(address,uint256)")
 * @param types - Array of parameter type strings
 * @param values - Array of parameter value strings
 * @returns Encoded function data with selector prefix
 */
export function abiEncodeFunctionData(
	signature: string,
	types: readonly string[],
	values: readonly string[],
): Uint8Array;

/**
 * Decode function data (extract selector and decode parameters)
 * @param data - Encoded function data
 * @param types - Array of expected parameter types
 * @returns Object with selector and decoded parameters
 */
export function abiDecodeFunctionData(
	data: Uint8Array,
	types: readonly string[],
): { selector: Uint8Array; parameters: string[] };

/**
 * Encode packed (non-standard compact encoding)
 * @param types - Array of type strings
 * @param values - Array of value strings
 * @returns Packed encoding (no padding)
 */
export function abiEncodePacked(
	types: readonly string[],
	values: readonly string[],
): Uint8Array;

/**
 * Estimate gas cost for calldata
 * @param data - Calldata bytes
 * @returns Estimated gas cost
 */
export function abiEstimateGas(data: Uint8Array): bigint;

// ============================================================================
// Access List API (EIP-2930)
// ============================================================================

/**
 * Calculate gas cost for access list
 * @param accessList - Access list items
 * @returns Gas cost
 */
export function accessListGasCost(
	accessList: Array<{ address: Uint8Array; storageKeys: Uint8Array[] }>,
): bigint;

/**
 * Calculate gas savings from using access list
 * @param accessList - Access list items
 * @returns Gas savings
 */
export function accessListGasSavings(
	accessList: Array<{ address: Uint8Array; storageKeys: Uint8Array[] }>,
): bigint;

/**
 * Check if address is in access list
 * @param accessList - Access list items
 * @param address - Address to check
 * @returns True if address is in list
 */
export function accessListIncludesAddress(
	accessList: Array<{ address: Uint8Array; storageKeys: Uint8Array[] }>,
	address: Uint8Array,
): boolean;

/**
 * Check if storage key is in access list for address
 * @param accessList - Access list items
 * @param address - Address to check
 * @param storageKey - Storage key to check
 * @returns True if storage key is in list
 */
export function accessListIncludesStorageKey(
	accessList: Array<{ address: Uint8Array; storageKeys: Uint8Array[] }>,
	address: Uint8Array,
	storageKey: Uint8Array,
): boolean;

// ============================================================================
// Authorization API (EIP-7702)
// ============================================================================

/**
 * Validate authorization structure
 * @param auth - Authorization to validate
 * @throws Error if invalid
 */
export function authorizationValidate(auth: {
	chainId: bigint;
	address: Uint8Array;
	nonce: bigint;
	yParity: number;
	r: bigint;
	s: bigint;
}): void;

/**
 * Calculate signing hash for authorization
 * @param chainId - Chain ID
 * @param address - Target address
 * @param nonce - Nonce
 * @returns Signing hash
 */
export function authorizationSigningHash(
	chainId: bigint,
	address: Uint8Array,
	nonce: bigint,
): Uint8Array;

/**
 * Recover authority (signer) from authorization
 * @param auth - Authorization to recover from
 * @returns Recovered authority address
 */
export function authorizationAuthority(auth: {
	chainId: bigint;
	address: Uint8Array;
	nonce: bigint;
	yParity: number;
	r: bigint;
	s: bigint;
}): Uint8Array;

/**
 * Calculate gas cost for authorization list
 * @param authCount - Number of authorizations
 * @param emptyAccounts - Number of empty accounts
 * @returns Gas cost
 */
export function authorizationGasCost(
	authCount: number,
	emptyAccounts: number,
): bigint;

// ============================================================================
// Blob API (EIP-4844)
// ============================================================================

/**
 * Blob size constant (131072 bytes = 128 KB).
 */
export const BLOB_SIZE: number;

/**
 * Encode data as blob (with length prefix)
 * @param data - Data to encode
 * @returns Blob (131072 bytes)
 */
export function blobFromData(data: Uint8Array): Uint8Array;

/**
 * Decode blob to extract original data
 * @param blob - Blob data (131072 bytes)
 * @returns Original data
 */
export function blobToData(blob: Uint8Array): Uint8Array;

/**
 * Validate blob size
 * @param blobLen - Length to validate
 * @returns true if valid blob size
 */
export function blobIsValid(blobLen: number): boolean;

/**
 * Calculate total blob gas for number of blobs
 * @param blobCount - Number of blobs
 * @returns Total blob gas
 */
export function blobCalculateGas(blobCount: number): bigint;

/**
 * Estimate number of blobs needed for data size
 * @param dataSize - Size of data in bytes
 * @returns Number of blobs required
 */
export function blobEstimateCount(dataSize: number): number;

/**
 * Calculate blob gas price from excess blob gas
 * @param excessBlobGas - Excess blob gas
 * @returns Blob gas price
 */
export function blobCalculateGasPrice(excessBlobGas: bigint): bigint;

/**
 * Calculate excess blob gas for next block
 * @param parentExcess - Parent block excess blob gas
 * @param parentUsed - Parent block blob gas used
 * @returns Excess blob gas for next block
 */
export function blobCalculateExcessGas(
	parentExcess: bigint,
	parentUsed: bigint,
): bigint;

// ============================================================================
// Event Log API
// ============================================================================

/**
 * Check if event log matches address filter
 * @param logAddress - Log address (20 bytes)
 * @param filterAddresses - Array of filter addresses
 * @returns true if matches
 */
export function eventLogMatchesAddress(
	logAddress: Uint8Array,
	filterAddresses: Uint8Array[],
): boolean;

/**
 * Check if event log matches single topic filter
 * @param logTopic - Log topic (32 bytes)
 * @param filterTopic - Filter topic (32 bytes) or null
 * @returns true if matches
 */
export function eventLogMatchesTopic(
	logTopic: Uint8Array,
	filterTopic: Uint8Array | null,
): boolean;

/**
 * Check if event log matches topic array filter
 * @param logTopics - Array of log topics
 * @param filterTopics - Array of filter topics (null entries match any)
 * @returns true if matches
 */
export function eventLogMatchesTopics(
	logTopics: Uint8Array[],
	filterTopics: Array<Uint8Array | null>,
): boolean;

// ============================================================================
// X25519 Operations
// ============================================================================

/**
 * Derive X25519 public key from secret key
 * @param secretKey - 32-byte secret key
 * @returns 32-byte public key
 */
export function x25519DerivePublicKey(secretKey: Uint8Array): Uint8Array;

/**
 * Perform X25519 scalar multiplication (ECDH)
 * @param secretKey - Your 32-byte secret key
 * @param publicKey - Their 32-byte public key
 * @returns 32-byte shared secret
 */
export function x25519Scalarmult(
	secretKey: Uint8Array,
	publicKey: Uint8Array,
): Uint8Array;

/**
 * Generate X25519 keypair from seed
 * @param seed - 32-byte seed
 * @returns Object with secretKey (32 bytes) and publicKey (32 bytes)
 */
export function x25519KeypairFromSeed(seed: Uint8Array): {
	secretKey: Uint8Array;
	publicKey: Uint8Array;
};

// ============================================================================
// Ed25519 Operations
// ============================================================================

/**
 * Sign message with Ed25519 secret key
 * @param message - Message to sign (any length)
 * @param secretKey - 64-byte secret key
 * @returns 64-byte signature
 */
export function ed25519Sign(
	message: Uint8Array,
	secretKey: Uint8Array,
): Uint8Array;

/**
 * Verify Ed25519 signature
 * @param message - Message that was signed
 * @param signature - 64-byte signature
 * @param publicKey - 32-byte public key
 * @returns True if signature is valid
 */
export function ed25519Verify(
	message: Uint8Array,
	signature: Uint8Array,
	publicKey: Uint8Array,
): boolean;

/**
 * Derive Ed25519 public key from secret key
 * @param secretKey - 64-byte secret key
 * @returns 32-byte public key
 */
export function ed25519DerivePublicKey(secretKey: Uint8Array): Uint8Array;

/**
 * Generate Ed25519 keypair from seed
 * @param seed - 32-byte seed
 * @returns Object with secretKey (64 bytes) and publicKey (32 bytes)
 */
export function ed25519KeypairFromSeed(seed: Uint8Array): {
	secretKey: Uint8Array;
	publicKey: Uint8Array;
};

// ============================================================================
// P256 (secp256r1) Operations
// ============================================================================

/**
 * Sign message hash with P256 private key
 * @param messageHash - 32-byte message hash
 * @param privateKey - 32-byte private key
 * @returns Signature as 64 bytes (r || s)
 */
export function p256Sign(
	messageHash: Uint8Array,
	privateKey: Uint8Array,
): Uint8Array;

/**
 * Verify P256 signature
 * @param messageHash - 32-byte message hash
 * @param signature - 64-byte signature (r || s)
 * @param publicKey - Uncompressed public key (64 bytes)
 * @returns True if signature is valid
 */
export function p256Verify(
	messageHash: Uint8Array,
	signature: Uint8Array,
	publicKey: Uint8Array,
): boolean;

/**
 * Derive P256 public key from private key
 * @param privateKey - 32-byte private key
 * @returns Uncompressed public key (64 bytes)
 */
export function p256DerivePublicKey(privateKey: Uint8Array): Uint8Array;

/**
 * Perform P256 ECDH key exchange
 * @param privateKey - 32-byte private key
 * @param publicKey - 64-byte public key
 * @returns Shared secret (32 bytes)
 */
export function p256Ecdh(
	privateKey: Uint8Array,
	publicKey: Uint8Array,
): Uint8Array;

// ============================================================================
// KZG API (EIP-4844)
// ============================================================================

/** KZG blob size in bytes (128 KB) */
export const KZG_BLOB_SIZE: number;
/** KZG commitment size in bytes (BLS12-381 G1 point) */
export const KZG_COMMITMENT_SIZE: number;
/** KZG proof size in bytes (BLS12-381 G1 point) */
export const KZG_PROOF_SIZE: number;
/** KZG field element size in bytes */
export const KZG_FIELD_ELEMENT_SIZE: number;

/**
 * Check if KZG trusted setup is initialized
 * @returns True if initialized
 */
export function kzgIsInitialized(): boolean;

/**
 * Load KZG trusted setup from embedded data
 *
 * Idempotent - safe to call multiple times (no-op if already loaded).
 * Uses the embedded trusted setup from c-kzg-4844.
 *
 * @throws {Error} If loading fails
 */
export function kzgLoadTrustedSetup(): void;

/**
 * Free KZG trusted setup resources
 *
 * Call when KZG operations are no longer needed.
 */
export function kzgFreeTrustedSetup(): void;

/**
 * Convert a blob to its KZG commitment
 *
 * @param blob - 131072-byte blob
 * @returns 48-byte KZG commitment (BLS12-381 G1 point)
 * @throws {Error} If trusted setup not loaded or blob is invalid
 */
export function kzgBlobToCommitment(blob: Uint8Array): Uint8Array;

/**
 * Compute KZG proof for a blob at a given point
 *
 * @param blob - 131072-byte blob
 * @param z - 32-byte field element (evaluation point)
 * @returns Object with proof (48 bytes) and y (32 bytes, evaluation result)
 * @throws {Error} If trusted setup not loaded or inputs are invalid
 */
export function kzgComputeProof(
	blob: Uint8Array,
	z: Uint8Array,
): { proof: Uint8Array; y: Uint8Array };

/**
 * Compute KZG proof for a blob given its commitment
 *
 * @param blob - 131072-byte blob
 * @param commitment - 48-byte KZG commitment
 * @returns 48-byte KZG proof
 * @throws {Error} If trusted setup not loaded or inputs are invalid
 */
export function kzgComputeBlobProof(
	blob: Uint8Array,
	commitment: Uint8Array,
): Uint8Array;

/**
 * Verify a KZG proof
 *
 * @param commitment - 48-byte KZG commitment
 * @param z - 32-byte field element (evaluation point)
 * @param y - 32-byte field element (claimed evaluation)
 * @param proof - 48-byte KZG proof
 * @returns True if proof is valid
 * @throws {Error} If trusted setup not loaded or inputs are invalid
 */
export function kzgVerifyProof(
	commitment: Uint8Array,
	z: Uint8Array,
	y: Uint8Array,
	proof: Uint8Array,
): boolean;

/**
 * Verify a KZG blob proof
 *
 * @param blob - 131072-byte blob
 * @param commitment - 48-byte KZG commitment
 * @param proof - 48-byte KZG proof
 * @returns True if proof is valid
 * @throws {Error} If trusted setup not loaded or inputs are invalid
 */
export function kzgVerifyBlobProof(
	blob: Uint8Array,
	commitment: Uint8Array,
	proof: Uint8Array,
): boolean;
