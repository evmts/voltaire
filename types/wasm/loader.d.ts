/**
 * WebAssembly module loader for Ethereum primitives
 * Handles WASM instantiation, memory management, and exports wrapping
 */
import type { WasmExports } from "./types";
/**
 * Load and instantiate the WASM module
 * @param wasmPath - Path to WASM file or ArrayBuffer
 * @returns Promise that resolves when WASM is loaded
 */
export declare function loadWasm(wasmPath: string | URL | ArrayBuffer): Promise<void>;
/**
 * Get the WASM exports (for direct access if needed)
 * @returns WASM exports
 */
export declare function getExports(): WasmExports;
/**
 * Reset memory allocator (call after operations to free memory)
 * @returns void
 */
export declare function resetMemory(): void;
/**
 * Create address from hex string
 * @param hex - Hex string (with or without 0x prefix)
 * @returns 20-byte address
 */
export declare function addressFromHex(hex: string): Uint8Array;
/**
 * Convert address to hex string
 * @param address - 20-byte address
 * @returns Hex string with 0x prefix
 */
export declare function addressToHex(address: Uint8Array): string;
/**
 * Convert address to checksummed hex (EIP-55)
 * @param address - 20-byte address
 * @returns Checksummed hex string
 */
export declare function addressToChecksumHex(address: Uint8Array): string;
/**
 * Check if address is zero address
 * @param address - 20-byte address
 * @returns True if zero address
 */
export declare function addressIsZero(address: Uint8Array): boolean;
/**
 * Compare two addresses for equality
 * @param a - First address
 * @param b - Second address
 * @returns True if equal
 */
export declare function addressEquals(a: Uint8Array, b: Uint8Array): boolean;
/**
 * Validate EIP-55 checksum
 * @param hex - Hex string to validate
 * @returns True if checksum is valid
 */
export declare function addressValidateChecksum(hex: string): boolean;
/**
 * Calculate CREATE contract address
 * @param sender - Sender address (20 bytes)
 * @param nonce - Nonce
 * @returns Contract address (20 bytes)
 */
export declare function calculateCreateAddress(sender: Uint8Array, nonce: number): Uint8Array;
/**
 * Calculate CREATE2 contract address
 * @param sender - Sender address (20 bytes)
 * @param salt - Salt (32 bytes)
 * @param initCode - Init code
 * @returns Contract address (20 bytes)
 */
export declare function calculateCreate2Address(sender: Uint8Array, salt: Uint8Array, initCode: Uint8Array): Uint8Array;
/**
 * Compute Keccak-256 hash
 * @param data - Input data
 * @returns 32-byte hash
 */
export declare function keccak256(data: Uint8Array): Uint8Array;
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
export declare function hashFromHex(hex: string): Uint8Array;
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
export declare function eip191HashMessage(message: Uint8Array): Uint8Array;
/**
 * Compute SHA-256 hash
 * @param data - Input data
 * @returns 32-byte hash
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
 * Generate a cryptographically secure random private key
 * @returns 32-byte private key
 */
export declare function generatePrivateKey(): Uint8Array;
/**
 * Compress uncompressed secp256k1 public key
 * @param uncompressed - 64-byte uncompressed public key (x, y coordinates)
 * @returns 33-byte compressed public key (0x02/0x03 prefix + x coordinate)
 */
export declare function compressPublicKey(uncompressed: Uint8Array): Uint8Array;
/**
 * Recover public key from ECDSA signature
 * @param messageHash - 32-byte message hash
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @param v - Recovery parameter (0-3)
 * @returns Uncompressed public key (64 bytes)
 */
export declare function secp256k1RecoverPubkey(messageHash: Uint8Array, r: Uint8Array, s: Uint8Array, v: number): Uint8Array;
/**
 * Recover Ethereum address from ECDSA signature
 * @param messageHash - 32-byte message hash
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @param v - Recovery parameter (0-3)
 * @returns Ethereum address (20 bytes)
 */
export declare function secp256k1RecoverAddress(messageHash: Uint8Array, r: Uint8Array, s: Uint8Array, v: number): Uint8Array;
/**
 * Derive public key from private key
 * @param privateKey - 32-byte private key
 * @returns Uncompressed public key (64 bytes)
 */
export declare function secp256k1PubkeyFromPrivate(privateKey: Uint8Array): Uint8Array;
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
//# sourceMappingURL=loader.d.ts.map