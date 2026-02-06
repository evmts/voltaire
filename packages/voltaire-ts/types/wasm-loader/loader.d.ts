/**
 * WebAssembly module loader for Ethereum primitives.
 * Handles WASM instantiation, memory management, and exports wrapping.
 *
 * @see https://voltaire.tevm.sh/getting-started for documentation
 * @since 0.0.0
 */
import type { Secp256k1PublicKeyType } from "../crypto/Secp256k1/Secp256k1PublicKeyType.js";
import type { AddressType as BrandedAddress } from "../primitives/Address/AddressType.js";
import type { HashType } from "../primitives/Hash/HashType.js";
import type { PrivateKeyType } from "../primitives/PrivateKey/PrivateKeyType.js";
import type { WasmExports } from "./types.js";
/**
 * Load and instantiate the WASM module.
 *
 * @see https://voltaire.tevm.sh/getting-started for documentation
 * @since 0.0.0
 * @param wasmPath - Path to WASM file, URL, or ArrayBuffer
 * @param forceReload - Force reload even if already loaded (for benchmarking different modes)
 * @returns Promise that resolves when WASM is loaded
 * @throws {Error} If WASM module does not export memory or instantiation fails
 * @example
 * ```javascript
 * import { loadWasm } from './wasm-loader/loader.js';
 * await loadWasm('./wasm/primitives.wasm');
 * ```
 */
export declare function loadWasm(wasmPath: string | URL | ArrayBuffer, forceReload?: boolean): Promise<void>;
/**
 * Get the WASM exports for direct access if needed.
 *
 * @see https://voltaire.tevm.sh/getting-started for documentation
 * @since 0.0.0
 * @returns WASM exports
 * @throws {Error} If WASM module not loaded
 * @example
 * ```javascript
 * import { loadWasm, getExports } from './wasm-loader/loader.js';
 * await loadWasm('./wasm/primitives.wasm');
 * const exports = getExports();
 * ```
 */
export declare function getExports(): WasmExports;
/**
 * Reset memory allocator to free allocated memory.
 *
 * @see https://voltaire.tevm.sh/getting-started for documentation
 * @since 0.0.0
 * @returns void
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { resetMemory } from './wasm-loader/loader.js';
 * resetMemory();
 * ```
 */
export declare function resetMemory(): void;
/**
 * Create address from hex string.
 *
 * @see https://voltaire.tevm.sh/primitives/address for documentation
 * @since 0.0.0
 * @param hex - Hex string (with or without 0x prefix)
 * @returns 20-byte address
 * @throws {Error} If hex string is invalid or wrong length
 * @example
 * ```javascript
 * import { addressFromHex } from './wasm-loader/loader.js';
 * const address = addressFromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * ```
 */
export declare function addressFromHex(hex: string): BrandedAddress;
/**
 * Convert address to hex string.
 *
 * @see https://voltaire.tevm.sh/primitives/address for documentation
 * @since 0.0.0
 * @param address - 20-byte address (BrandedAddress guarantees correctness)
 * @returns Hex string with 0x prefix
 * @example
 * ```javascript
 * import { addressToHex } from './wasm-loader/loader.js';
 * const hex = addressToHex(brandedAddress);
 * ```
 */
export declare function addressToHex(address: Uint8Array): string;
/**
 * Convert address to checksummed hex (EIP-55).
 *
 * @see https://voltaire.tevm.sh/primitives/address for documentation
 * @since 0.0.0
 * @param address - 20-byte address (BrandedAddress guarantees correctness)
 * @returns Checksummed hex string
 * @example
 * ```javascript
 * import { addressToChecksumHex } from './wasm-loader/loader.js';
 * const checksummed = addressToChecksumHex(brandedAddress);
 * ```
 */
export declare function addressToChecksumHex(address: Uint8Array): string;
/**
 * Check if address is zero address.
 *
 * @see https://voltaire.tevm.sh/primitives/address for documentation
 * @since 0.0.0
 * @param address - 20-byte address
 * @returns True if zero address
 * @throws {Error} If address is invalid length
 * @example
 * ```javascript
 * import { addressIsZero } from './wasm-loader/loader.js';
 * const isZero = addressIsZero(address);
 * ```
 */
export declare function addressIsZero(address: Uint8Array): boolean;
/**
 * Compare two addresses for equality.
 *
 * @see https://voltaire.tevm.sh/primitives/address for documentation
 * @since 0.0.0
 * @param a - First address
 * @param b - Second address
 * @returns True if equal
 * @throws {Error} If addresses are invalid length
 * @example
 * ```javascript
 * import { addressEquals } from './wasm-loader/loader.js';
 * const equal = addressEquals(addr1, addr2);
 * ```
 */
export declare function addressEquals(a: Uint8Array, b: Uint8Array): boolean;
/**
 * Validate EIP-55 checksum.
 *
 * @see https://voltaire.tevm.sh/primitives/address for documentation
 * @since 0.0.0
 * @param hex - Hex string to validate
 * @returns True if checksum is valid
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { addressValidateChecksum } from './wasm-loader/loader.js';
 * const isValid = addressValidateChecksum('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * ```
 */
export declare function addressValidateChecksum(hex: string): boolean;
/**
 * Calculate CREATE contract address.
 *
 * @see https://voltaire.tevm.sh/primitives/address for documentation
 * @since 0.0.0
 * @param sender - Sender address (20 bytes)
 * @param nonce - Nonce
 * @returns Contract address (20 bytes)
 * @throws {Error} If calculation fails or inputs are invalid
 * @example
 * ```javascript
 * import { calculateCreateAddress } from './wasm-loader/loader.js';
 * const address = calculateCreateAddress(senderAddress, 5);
 * ```
 */
export declare function calculateCreateAddress(sender: Uint8Array, nonce: number | bigint): BrandedAddress;
/**
 * Calculate CREATE2 contract address.
 *
 * @see https://voltaire.tevm.sh/primitives/address for documentation
 * @since 0.0.0
 * @param sender - Sender address (20 bytes)
 * @param salt - Salt (32 bytes)
 * @param initCode - Init code
 * @returns Contract address (20 bytes)
 * @throws {Error} If calculation fails or inputs are invalid
 * @example
 * ```javascript
 * import { calculateCreate2Address } from './wasm-loader/loader.js';
 * const address = calculateCreate2Address(sender, salt, initCode);
 * ```
 */
export declare function calculateCreate2Address(sender: Uint8Array, salt: Uint8Array, initCode: Uint8Array): BrandedAddress;
/**
 * Compute Keccak-256 hash.
 *
 * @see https://voltaire.tevm.sh/primitives/hash for documentation
 * @since 0.0.0
 * @param data - Input data
 * @returns 32-byte hash
 * @throws {Error} If hashing fails
 * @example
 * ```javascript
 * import { keccak256 } from './wasm-loader/loader.js';
 * const hash = keccak256(new Uint8Array([1, 2, 3]));
 * ```
 */
export declare function keccak256(data: Uint8Array): HashType;
/**
 * Convert hash to hex string
 * @param hash - 32-byte hash
 * @returns Hex string with 0x prefix
 */
export declare function hashToHex(hash: Uint8Array): string;
/**
 * Create hash from hex string
 * @param hex - Hex string (with or without 0x prefix)
 * @returns 32-byte hash
 */
export declare function hashFromHex(hex: string): HashType;
/**
 * Compare two hashes for equality (constant-time)
 * @param a - First hash
 * @param b - Second hash
 * @returns True if equal
 */
export declare function hashEquals(a: Uint8Array, b: Uint8Array): boolean;
/**
 * Hash message using EIP-191 format
 * @param message - Message to hash
 * @returns 32-byte hash
 */
export declare function eip191HashMessage(message: Uint8Array): HashType;
/**
 * Compute SHA-256 hash.
 *
 * @see https://voltaire.tevm.sh/getting-started for documentation
 * @since 0.0.0
 * @param data - Input data
 * @returns 32-byte hash
 * @throws {Error} If hashing fails
 * @example
 * ```javascript
 * import { sha256 } from './wasm-loader/loader.js';
 * const hash = sha256(new Uint8Array([1, 2, 3]));
 * ```
 */
export declare function sha256(data: Uint8Array): Uint8Array;
/**
 * Compute RIPEMD-160 hash
 * @param data - Input data
 * @returns 20-byte hash
 */
export declare function ripemd160(data: Uint8Array): Uint8Array;
/**
 * Compute BLAKE2b hash
 * @param data - Input data
 * @returns 64-byte hash
 */
export declare function blake2b(data: Uint8Array): Uint8Array;
/**
 * Compute BLAKE2b hash with variable output length
 * @param data - Input data
 * @param outputLength - Output length in bytes (1-64)
 * @returns BLAKE2b hash of specified length
 */
export declare function blake2Hash(data: Uint8Array, outputLength: number): Uint8Array;
/**
 * Compute Solidity-style Keccak-256 hash of tightly packed data
 * @param packedData - Pre-packed data bytes
 * @returns 32-byte hash
 */
export declare function solidityKeccak256(packedData: Uint8Array): Uint8Array;
/**
 * Compute Solidity-style SHA-256 hash of tightly packed data
 * @param packedData - Pre-packed data bytes
 * @returns 32-byte hash
 */
export declare function soliditySha256(packedData: Uint8Array): Uint8Array;
/**
 * Encode bytes as RLP
 * @param data - Data to encode
 * @returns RLP-encoded data
 */
export declare function rlpEncodeBytes(data: Uint8Array): Uint8Array;
/**
 * Encode unsigned integer as RLP
 * @param value - 32-byte big-endian u256
 * @returns RLP-encoded data
 */
export declare function rlpEncodeUint(value: Uint8Array): Uint8Array;
/**
 * Convert RLP bytes to hex string
 * @param rlpData - RLP-encoded data
 * @returns Hex string with 0x prefix
 */
export declare function rlpToHex(rlpData: Uint8Array): string;
/**
 * Convert hex string to RLP bytes
 * @param hex - Hex string (with or without 0x prefix)
 * @returns RLP bytes
 */
export declare function rlpFromHex(hex: string): Uint8Array;
/**
 * Analyze bytecode to find JUMPDEST locations
 * @param code - EVM bytecode
 * @returns Array of JUMPDEST positions
 */
export declare function bytecodeAnalyzeJumpdests(code: Uint8Array): number[];
/**
 * Check if position is at bytecode boundary
 * @param code - EVM bytecode
 * @param position - Position to check
 * @returns True if at boundary
 */
export declare function bytecodeIsBoundary(code: Uint8Array, position: number): boolean;
/**
 * Check if position is a valid JUMPDEST
 * @param code - EVM bytecode
 * @param position - Position to check
 * @returns True if valid JUMPDEST
 */
export declare function bytecodeIsValidJumpdest(code: Uint8Array, position: number): boolean;
/**
 * Validate bytecode for basic correctness
 * @param code - EVM bytecode
 * @throws Error if bytecode is invalid
 */
export declare function bytecodeValidate(code: Uint8Array): void;
/**
 * Get next program counter after current instruction
 * @param code - EVM bytecode
 * @param currentPc - Current program counter
 * @returns Next PC or undefined if at end of bytecode
 */
export declare function bytecodeGetNextPc(code: Uint8Array, currentPc: number): number | undefined;
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
export declare function bytecodeScan(code: Uint8Array, startPc: number, endPc: number): Instruction[];
/**
 * Fusion pattern data structure
 */
export interface FusionPattern {
    pc: number;
    patternType: number;
    firstOpcode: number;
    secondOpcode: number;
}
/**
 * Detect instruction fusion patterns (optimizable sequences)
 * @param code - EVM bytecode
 * @returns Array of detected fusion patterns
 */
export declare function bytecodeDetectFusions(code: Uint8Array): FusionPattern[];
/**
 * Convert hex string to U256 (32-byte big-endian)
 * @param hex - Hex string (with or without 0x prefix)
 * @returns 32-byte U256 value
 */
export declare function u256FromHex(hex: string): Uint8Array;
/**
 * Convert U256 to hex string
 * @param value - 32-byte U256 value (big-endian)
 * @returns Hex string with 0x prefix (66 chars)
 */
export declare function u256ToHex(value: Uint8Array): string;
/**
 * Convert hex string to bytes
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Raw bytes
 */
export declare function hexToBytes(hex: string): Uint8Array;
/**
 * Convert bytes to hex string
 * @param data - Raw bytes
 * @returns Hex string with 0x prefix
 */
export declare function bytesToHex(data: Uint8Array): string;
/**
 * Detect transaction type from serialized data
 * @param data - RLP-encoded transaction data
 * @returns Transaction type (0=Legacy, 1=EIP2930, 2=EIP1559, 3=EIP4844, 4=EIP7702)
 */
export declare function txDetectType(data: Uint8Array): number;
/**
 * Generate a cryptographically secure random private key.
 *
 * @see https://voltaire.tevm.sh/getting-started for documentation
 * @since 0.0.0
 * @returns 32-byte private key
 * @throws {Error} If key generation fails
 * @example
 * ```javascript
 * import { generatePrivateKey } from './wasm-loader/loader.js';
 * const privateKey = generatePrivateKey();
 * ```
 */
export declare function generatePrivateKey(): PrivateKeyType;
/**
 * Compress uncompressed secp256k1 public key
 * @param uncompressed - 64-byte uncompressed public key (Secp256k1PublicKeyType guarantees correctness)
 * @returns 33-byte compressed public key (0x02/0x03 prefix + x coordinate)
 */
export declare function compressPublicKey(uncompressed: Uint8Array): Uint8Array;
/**
 * Sign message hash with private key using secp256k1.
 *
 * @see https://voltaire.tevm.sh/getting-started for documentation
 * @since 0.0.0
 * @param messageHash - 32-byte message hash
 * @param privateKey - 32-byte private key
 * @returns Object with r (32 bytes), s (32 bytes), and v (recovery ID 0-1)
 * @throws {Error} If signing fails
 * @example
 * ```javascript
 * import { secp256k1Sign } from './wasm-loader/loader.js';
 * const sig = secp256k1Sign(messageHash, privateKey);
 * ```
 */
export declare function secp256k1Sign(messageHash: Uint8Array, privateKey: Uint8Array): {
    r: Uint8Array;
    s: Uint8Array;
    v: number;
};
/**
 * Verify ECDSA signature
 * @param messageHash - 32-byte message hash
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @param publicKey - Uncompressed public key (64 bytes)
 * @returns True if signature is valid
 */
export declare function secp256k1Verify(messageHash: Uint8Array, r: Uint8Array, s: Uint8Array, publicKey: Uint8Array): boolean;
/**
 * Recover public key from ECDSA signature
 * @param messageHash - 32-byte message hash
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @param v - Recovery parameter (0-3)
 * @returns Uncompressed public key (64 bytes)
 */
export declare function secp256k1RecoverPubkey(messageHash: Uint8Array, r: Uint8Array, s: Uint8Array, v: number): Secp256k1PublicKeyType;
/**
 * Recover Ethereum address from ECDSA signature
 * @param messageHash - 32-byte message hash
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @param v - Recovery parameter (0-3)
 * @returns Ethereum address (20 bytes)
 */
export declare function secp256k1RecoverAddress(messageHash: Uint8Array, r: Uint8Array, s: Uint8Array, v: number): BrandedAddress;
/**
 * Derive public key from private key
 * @param privateKey - 32-byte private key
 * @returns Uncompressed public key (64 bytes)
 */
export declare function secp256k1PubkeyFromPrivate(privateKey: Uint8Array): Secp256k1PublicKeyType;
/**
 * Validate ECDSA signature components
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @returns True if signature is valid
 */
export declare function secp256k1ValidateSignature(r: Uint8Array, s: Uint8Array): boolean;
/**
 * Normalize signature to canonical form (low-s)
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @returns Normalized [r, s] components
 */
export declare function signatureNormalize(r: Uint8Array, s: Uint8Array): [Uint8Array, Uint8Array];
/**
 * Check if signature is in canonical form
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @returns True if signature is canonical
 */
export declare function signatureIsCanonical(r: Uint8Array, s: Uint8Array): boolean;
/**
 * Parse signature from compact format
 * @param sigData - Signature bytes (64 or 65 bytes)
 * @returns [r, s, v] components
 */
export declare function signatureParse(sigData: Uint8Array): [Uint8Array, Uint8Array, Uint8Array];
/**
 * Serialize signature to compact format
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @param v - Recovery parameter
 * @param includeV - Whether to include v byte
 * @returns Serialized signature
 */
export declare function signatureSerialize(r: Uint8Array, s: Uint8Array, v: number, includeV: boolean): Uint8Array;
/**
 * Compute function selector from signature.
 *
 * @see https://voltaire.tevm.sh/primitives/abi for documentation
 * @since 0.0.0
 * @param signature - Function signature string (e.g., "transfer(address,uint256)")
 * @returns 4-byte selector
 * @throws {Error} If signature is invalid
 * @example
 * ```javascript
 * import { abiComputeSelector } from './wasm-loader/loader.js';
 * const selector = abiComputeSelector('transfer(address,uint256)');
 * ```
 */
export declare function abiComputeSelector(signature: string): Uint8Array;
/**
 * Encode ABI parameters
 * @param types - Array of type strings (e.g., ["address", "uint256", "bool"])
 * @param values - Array of value strings (e.g., ["0x...", "42", "true"])
 * @returns Encoded ABI data
 */
export declare function abiEncodeParameters(types: string[], values: string[]): Uint8Array;
/**
 * Decode ABI parameters
 * @param data - Encoded ABI data
 * @param types - Array of type strings (e.g., ["address", "uint256", "bool"])
 * @returns Array of decoded value strings
 */
export declare function abiDecodeParameters(data: Uint8Array, types: string[]): string[];
/**
 * Encode function data (selector + parameters)
 * @param signature - Function signature string (e.g., "transfer(address,uint256)")
 * @param types - Array of parameter type strings
 * @param values - Array of parameter value strings
 * @returns Encoded function data with selector prefix
 */
export declare function abiEncodeFunctionData(signature: string, types: string[], values: string[]): Uint8Array;
/**
 * Decode function data (extract selector and decode parameters)
 * @param data - Encoded function data
 * @param types - Array of expected parameter types
 * @returns Object with selector and decoded parameters
 */
export declare function abiDecodeFunctionData(data: Uint8Array, types: string[]): {
    selector: Uint8Array;
    parameters: string[];
};
/**
 * Encode packed (non-standard compact encoding)
 * @param types - Array of type strings
 * @param values - Array of value strings
 * @returns Packed encoding (no padding)
 */
export declare function abiEncodePacked(types: string[], values: string[]): Uint8Array;
/**
 * Estimate gas cost for calldata
 * @param data - Calldata bytes
 * @returns Estimated gas cost
 */
export declare function abiEstimateGas(data: Uint8Array): bigint;
/**
 * Calculate gas cost for access list
 * @param accessList - Access list items
 * @returns Gas cost
 */
export declare function accessListGasCost(accessList: Array<{
    address: Uint8Array;
    storageKeys: Uint8Array[];
}>): bigint;
/**
 * Calculate gas savings from using access list
 * @param accessList - Access list items
 * @returns Gas savings
 */
export declare function accessListGasSavings(accessList: Array<{
    address: Uint8Array;
    storageKeys: Uint8Array[];
}>): bigint;
/**
 * Check if address is in access list
 * @param accessList - Access list items
 * @param address - Address to check
 * @returns True if address is in list
 */
export declare function accessListIncludesAddress(accessList: Array<{
    address: Uint8Array;
    storageKeys: Uint8Array[];
}>, address: Uint8Array): boolean;
/**
 * Check if storage key is in access list for address
 * @param accessList - Access list items
 * @param address - Address to check
 * @param storageKey - Storage key to check
 * @returns True if storage key is in list
 */
export declare function accessListIncludesStorageKey(accessList: Array<{
    address: Uint8Array;
    storageKeys: Uint8Array[];
}>, address: Uint8Array, storageKey: Uint8Array): boolean;
/**
 * Validate authorization structure
 * @param auth - Authorization to validate
 * @throws Error if invalid
 */
export declare function authorizationValidate(auth: {
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
export declare function authorizationSigningHash(chainId: bigint, address: Uint8Array, nonce: bigint): Uint8Array;
/**
 * Recover authority (signer) from authorization
 * @param auth - Authorization to recover from
 * @returns Recovered authority address
 */
export declare function authorizationAuthority(auth: {
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
export declare function authorizationGasCost(authCount: number, emptyAccounts: number): bigint;
/**
 * Blob size constant (131072 bytes = 128 KB).
 *
 * @see https://voltaire.tevm.sh/primitives/blob for documentation
 * @since 0.0.0
 * @example
 * ```javascript
 * import { BLOB_SIZE } from './wasm-loader/loader.js';
 * console.log(`Blob size: ${BLOB_SIZE} bytes`);
 * ```
 */
export declare const BLOB_SIZE = 131072;
/**
 * Encode data as blob (with length prefix)
 * @param data - Data to encode
 * @returns Blob (131072 bytes)
 */
export declare function blobFromData(data: Uint8Array): Uint8Array;
/**
 * Decode blob to extract original data
 * @param blob - Blob data (131072 bytes)
 * @returns Original data
 */
export declare function blobToData(blob: Uint8Array): Uint8Array;
/**
 * Validate blob size
 * @param blobLen - Length to validate
 * @returns true if valid blob size
 */
export declare function blobIsValid(blobLen: number): boolean;
/**
 * Calculate total blob gas for number of blobs
 * @param blobCount - Number of blobs
 * @returns Total blob gas
 */
export declare function blobCalculateGas(blobCount: number): bigint;
/**
 * Estimate number of blobs needed for data size
 * @param dataSize - Size of data in bytes
 * @returns Number of blobs required
 */
export declare function blobEstimateCount(dataSize: number): number;
/**
 * Calculate blob gas price from excess blob gas
 * @param excessBlobGas - Excess blob gas
 * @returns Blob gas price
 */
export declare function blobCalculateGasPrice(excessBlobGas: bigint): bigint;
/**
 * Calculate excess blob gas for next block
 * @param parentExcess - Parent block excess blob gas
 * @param parentUsed - Parent block blob gas used
 * @returns Excess blob gas for next block
 */
export declare function blobCalculateExcessGas(parentExcess: bigint, parentUsed: bigint): bigint;
/**
 * Check if event log matches address filter
 * @param logAddress - Log address (20 bytes)
 * @param filterAddresses - Array of filter addresses
 * @returns true if matches
 */
export declare function eventLogMatchesAddress(logAddress: Uint8Array, filterAddresses: Uint8Array[]): boolean;
/**
 * Check if event log matches single topic filter
 * @param logTopic - Log topic (32 bytes)
 * @param filterTopic - Filter topic (32 bytes) or null
 * @returns true if matches
 */
export declare function eventLogMatchesTopic(logTopic: Uint8Array, filterTopic: Uint8Array | null): boolean;
/**
 * Check if event log matches topic array filter
 * @param logTopics - Array of log topics
 * @param filterTopics - Array of filter topics (null entries match any)
 * @returns true if matches
 */
export declare function eventLogMatchesTopics(logTopics: Uint8Array[], filterTopics: (Uint8Array | null)[]): boolean;
/**
 * Derive X25519 public key from secret key
 * @param secretKey - 32-byte secret key
 * @returns 32-byte public key
 */
export declare function x25519DerivePublicKey(secretKey: Uint8Array): Uint8Array;
/**
 * Perform X25519 scalar multiplication (ECDH)
 * @param secretKey - Your 32-byte secret key
 * @param publicKey - Their 32-byte public key
 * @returns 32-byte shared secret
 */
export declare function x25519Scalarmult(secretKey: Uint8Array, publicKey: Uint8Array): Uint8Array;
/**
 * Generate X25519 keypair from seed
 * @param seed - 32-byte seed
 * @returns Object with secretKey (32 bytes) and publicKey (32 bytes)
 */
export declare function x25519KeypairFromSeed(seed: Uint8Array): {
    secretKey: Uint8Array;
    publicKey: Uint8Array;
};
/**
 * Sign message with Ed25519 secret key
 * @param message - Message to sign (any length)
 * @param secretKey - 64-byte secret key
 * @returns 64-byte signature
 */
export declare function ed25519Sign(message: Uint8Array, secretKey: Uint8Array): Uint8Array;
/**
 * Verify Ed25519 signature
 * @param message - Message that was signed
 * @param signature - 64-byte signature
 * @param publicKey - 32-byte public key
 * @returns True if signature is valid
 */
export declare function ed25519Verify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean;
/**
 * Derive Ed25519 public key from secret key
 * @param secretKey - 64-byte secret key
 * @returns 32-byte public key
 */
export declare function ed25519DerivePublicKey(secretKey: Uint8Array): Uint8Array;
/**
 * Generate Ed25519 keypair from seed
 * @param seed - 32-byte seed
 * @returns Object with secretKey (64 bytes) and publicKey (32 bytes)
 */
export declare function ed25519KeypairFromSeed(seed: Uint8Array): {
    secretKey: Uint8Array;
    publicKey: Uint8Array;
};
/**
 * Sign message hash with P256 private key
 * @param messageHash - 32-byte message hash
 * @param privateKey - 32-byte private key
 * @returns Signature as 64 bytes (r || s)
 */
export declare function p256Sign(messageHash: Uint8Array, privateKey: Uint8Array): Uint8Array;
/**
 * Verify P256 signature
 * @param messageHash - 32-byte message hash
 * @param signature - 64-byte signature (r || s)
 * @param publicKey - Uncompressed public key (64 bytes)
 * @returns True if signature is valid
 */
export declare function p256Verify(messageHash: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean;
/**
 * Derive P256 public key from private key
 * @param privateKey - 32-byte private key
 * @returns Uncompressed public key (64 bytes)
 */
export declare function p256DerivePublicKey(privateKey: Uint8Array): Uint8Array;
/**
 * Perform P256 ECDH key exchange
 * @param privateKey - 32-byte private key
 * @param publicKey - 64-byte public key
 * @returns Shared secret (32 bytes)
 */
export declare function p256Ecdh(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array;
/** KZG blob size in bytes (128 KB) */
export declare const KZG_BLOB_SIZE = 131072;
/** KZG commitment size in bytes (BLS12-381 G1 point) */
export declare const KZG_COMMITMENT_SIZE = 48;
/** KZG proof size in bytes (BLS12-381 G1 point) */
export declare const KZG_PROOF_SIZE = 48;
/** KZG field element size in bytes */
export declare const KZG_FIELD_ELEMENT_SIZE = 32;
/**
 * Check if KZG trusted setup is initialized
 * @returns True if initialized
 */
export declare function kzgIsInitialized(): boolean;
/**
 * Load KZG trusted setup from embedded data
 *
 * Idempotent - safe to call multiple times (no-op if already loaded).
 * Uses the embedded trusted setup from c-kzg-4844.
 *
 * @throws {Error} If loading fails
 */
export declare function kzgLoadTrustedSetup(): void;
/**
 * Free KZG trusted setup resources
 *
 * Call when KZG operations are no longer needed.
 */
export declare function kzgFreeTrustedSetup(): void;
/**
 * Convert a blob to its KZG commitment
 *
 * @param blob - 131072-byte blob
 * @returns 48-byte KZG commitment (BLS12-381 G1 point)
 * @throws {Error} If trusted setup not loaded or blob is invalid
 */
export declare function kzgBlobToCommitment(blob: Uint8Array): Uint8Array;
/**
 * Compute KZG proof for a blob at a given point
 *
 * @param blob - 131072-byte blob
 * @param z - 32-byte field element (evaluation point)
 * @returns Object with proof (48 bytes) and y (32 bytes, evaluation result)
 * @throws {Error} If trusted setup not loaded or inputs are invalid
 */
export declare function kzgComputeProof(blob: Uint8Array, z: Uint8Array): {
    proof: Uint8Array;
    y: Uint8Array;
};
/**
 * Compute KZG proof for a blob given its commitment
 *
 * @param blob - 131072-byte blob
 * @param commitment - 48-byte KZG commitment
 * @returns 48-byte KZG proof
 * @throws {Error} If trusted setup not loaded or inputs are invalid
 */
export declare function kzgComputeBlobProof(blob: Uint8Array, commitment: Uint8Array): Uint8Array;
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
export declare function kzgVerifyProof(commitment: Uint8Array, z: Uint8Array, y: Uint8Array, proof: Uint8Array): boolean;
/**
 * Verify a KZG blob proof
 *
 * @param blob - 131072-byte blob
 * @param commitment - 48-byte KZG commitment
 * @param proof - 48-byte KZG proof
 * @returns True if proof is valid
 * @throws {Error} If trusted setup not loaded or inputs are invalid
 */
export declare function kzgVerifyBlobProof(blob: Uint8Array, commitment: Uint8Array, proof: Uint8Array): boolean;
//# sourceMappingURL=loader.d.ts.map