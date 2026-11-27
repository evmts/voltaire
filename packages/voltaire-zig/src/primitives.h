/**
 * Primitives C API
 *
 * C bindings for Ethereum primitives library
 * Provides address operations, hashing, hex utilities, and more.
 *
 * AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from src/c_api.zig by scripts/generate_c_header.zig
 */

#ifndef PRIMITIVES_H
#define PRIMITIVES_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

// ============================================================================
// Error Codes
// ============================================================================

/** Operation completed successfully */
#define PRIMITIVES_SUCCESS 0

/** Invalid hexadecimal string */
#define PRIMITIVES_ERROR_INVALID_HEX -1

/** Invalid length for operation */
#define PRIMITIVES_ERROR_INVALID_LENGTH -2

/** Invalid checksum (EIP-55) */
#define PRIMITIVES_ERROR_INVALID_CHECKSUM -3

/** Out of memory */
#define PRIMITIVES_ERROR_OUT_OF_MEMORY -4

/** Invalid input parameter */
#define PRIMITIVES_ERROR_INVALID_INPUT -5

/** Invalid signature */
#define PRIMITIVES_ERROR_INVALID_SIGNATURE -6

#define PRIMITIVES_ERROR_INVALID_SELECTOR -7

#define PRIMITIVES_ERROR_UNSUPPORTED_TYPE -8

#define PRIMITIVES_ERROR_MAX_LENGTH_EXCEEDED -9

#define PRIMITIVES_ERROR_ACCESS_LIST_INVALID -10

#define PRIMITIVES_ERROR_AUTHORIZATION_INVALID -11

#define PRIMITIVES_ERROR_KZG_NOT_LOADED -20

#define PRIMITIVES_ERROR_KZG_INVALID_BLOB -21

#define PRIMITIVES_ERROR_KZG_INVALID_PROOF -22


// ============================================================================
// Types
// ============================================================================

/** Ethereum address (20 bytes) */
typedef struct {
    uint8_t bytes[20];
} PrimitivesAddress;

/** Hash value (32 bytes) - used for Keccak-256, etc. */
typedef struct {
    uint8_t bytes[32];
} PrimitivesHash;

/** 256-bit unsigned integer (32 bytes, big-endian) */
typedef struct {
    uint8_t bytes[32];
} PrimitivesU256;

/** Signature structure (65 bytes: r + s + v) */
typedef struct {
    uint8_t r[32];
    uint8_t s[32];
    uint8_t v;
} PrimitivesSignature;

/** Access List Entry structure (EIP-2930) */
typedef struct {
    PrimitivesAddress address;
    const PrimitivesHash * storage_keys_ptr;
    size_t storage_keys_len;
} PrimitivesAccessListEntry;

/** Authorization structure (EIP-7702) */
typedef struct {
    uint64_t chain_id;
    PrimitivesAddress address;
    uint64_t nonce;
    uint64_t v;
    uint8_t r[32];
    uint8_t s[32];
} PrimitivesAuthorization;


// ============================================================================
// Address API
// ============================================================================

/**
 * Create address from hex string (with or without 0x prefix)
 * Returns PRIMITIVES_SUCCESS on success
 */
int primitives_address_from_hex(const char * hex, PrimitivesAddress * out_address);

/**
 * Convert address to hex string (42 bytes: "0x" + 40 hex chars)
 * buf must be at least 42 bytes
 */
int primitives_address_to_hex(const PrimitivesAddress * address, uint8_t * buf);

/**
 * Convert address to checksummed hex (EIP-55)
 * buf must be at least 42 bytes
 */
int primitives_address_to_checksum_hex(const PrimitivesAddress * address, uint8_t * buf);

/**
 * Check if address is zero address
 */
bool primitives_address_is_zero(const PrimitivesAddress * address);

/**
 * Compare two addresses for equality
 */
bool primitives_address_equals(const PrimitivesAddress * a, const PrimitivesAddress * b);

/**
 * Validate EIP-55 checksum
 */
bool primitives_address_validate_checksum(const char * hex);

// ============================================================================
// Keccak-256 API
// ============================================================================

/**
 * Compute Keccak-256 hash of input data
 */
int primitives_keccak256(const uint8_t * data, size_t data_len, PrimitivesHash * out_hash);

/**
 * Convert hash to hex string (66 bytes: "0x" + 64 hex chars)
 * buf must be at least 66 bytes
 */
int primitives_hash_to_hex(const PrimitivesHash * hash, uint8_t * buf);

/**
 * Create hash from hex string
 */
int primitives_hash_from_hex(const char * hex, PrimitivesHash * out_hash);

/**
 * Compare two hashes for equality (constant-time)
 */
bool primitives_hash_equals(const PrimitivesHash * a, const PrimitivesHash * b);

// ============================================================================
// Hex utilities API
// ============================================================================

/**
 * Convert hex string to bytes
 * Returns the number of bytes written, or negative error code
 */
int primitives_hex_to_bytes(const char * hex, uint8_t * out_buf, size_t buf_len);

/**
 * Convert bytes to hex string
 * Returns the number of characters written (including 0x prefix), or negative error code
 */
int primitives_bytes_to_hex(const uint8_t * data, size_t data_len, uint8_t * out_buf, size_t buf_len);

// ============================================================================
// U256 utilities API
// ============================================================================

/**
 * Parse u256 from hex string
 */
int primitives_u256_from_hex(const char * hex, PrimitivesU256 * out_u256);

/**
 * Convert u256 to hex string (66 bytes: "0x" + 64 hex chars)
 */
int primitives_u256_to_hex(const PrimitivesU256 * value_u256, uint8_t * buf, size_t buf_len);

// ============================================================================
// EIP-191 Personal Message Signing
// ============================================================================

/**
 * Hash a message using EIP-191 personal message format
 */
int primitives_eip191_hash_message(const uint8_t * message, size_t message_len, PrimitivesHash * out_hash);

// ============================================================================
// Address derivation
// ============================================================================

/**
 * Calculate CREATE contract address (from sender and nonce)
 */
int primitives_calculate_create_address(const PrimitivesAddress * sender, uint64_t nonce, PrimitivesAddress * out_address);

// ============================================================================
// Cryptographic Signatures (secp256k1)
// ============================================================================

/**
 * Recover public key from ECDSA signature
 * Returns PRIMITIVES_SUCCESS on success
 */
int primitives_secp256k1_recover_pubkey(const uint8_t * message_hash, const uint8_t * r, const uint8_t * s, uint8_t v, uint8_t * out_pubkey);

/**
 * Recover Ethereum address from ECDSA signature
 */
int primitives_secp256k1_recover_address(const uint8_t * message_hash, const uint8_t * r, const uint8_t * s, uint8_t v, PrimitivesAddress * out_address);

/**
 * Derive public key from private key
 */
int primitives_secp256k1_pubkey_from_private(const uint8_t * private_key, uint8_t * out_pubkey);

/**
 * Validate ECDSA signature components
 */
bool primitives_secp256k1_validate_signature(const uint8_t * r, const uint8_t * s);

// ============================================================================
// WASM-specific secp256k1 functions (inline to avoid module conflicts)
// ============================================================================

/**
 * Sign message hash with private key (WASM variant)
 */
int secp256k1Sign(const uint8_t * msgHash_ptr, const uint8_t * privKey_ptr, uint8_t * sig_ptr, uint8_t * recid_ptr);

/**
 * Verify signature (WASM variant)
 */
int secp256k1Verify(const uint8_t * msgHash_ptr, const uint8_t * sig_ptr, const uint8_t * pubKey_ptr);

/**
 * Recover public key from signature (WASM variant)
 */
int secp256k1Recover(const uint8_t * msgHash_ptr, const uint8_t * sig_ptr, uint8_t recid, uint8_t * pubKey_ptr);

/**
 * Derive public key from private key (WASM variant)
 */
int secp256k1DerivePublicKey(const uint8_t * privKey_ptr, uint8_t * pubKey_ptr);

// ============================================================================
// Hash Algorithms (SHA256, RIPEMD160)
// ============================================================================

/**
 * Compute SHA256 hash of input data
 */
int primitives_sha256(const uint8_t * data, size_t data_len, uint8_t * out_hash);

/**
 * Compute RIPEMD160 hash of input data
 */
int primitives_ripemd160(const uint8_t * data, size_t data_len, uint8_t * out_hash);

// ============================================================================
// RLP Encoding/Decoding
// ============================================================================

/**
 * Encode bytes as RLP
 * Returns the number of bytes written, or negative error code
 */
int primitives_rlp_encode_bytes(const uint8_t * data, size_t data_len, uint8_t * out_buf, size_t buf_len);

/**
 * Encode unsigned integer as RLP
 * value_bytes must be 32 bytes (big-endian u256)
 */
int primitives_rlp_encode_uint(const uint8_t * value_bytes, uint8_t * out_buf, size_t buf_len);

/**
 * Convert RLP bytes to hex string
 */
int primitives_rlp_to_hex(const uint8_t * rlp_data, size_t rlp_len, uint8_t * out_buf, size_t buf_len);

/**
 * Convert hex string to RLP bytes
 */
int primitives_rlp_from_hex(const char * hex, uint8_t * out_buf, size_t buf_len);

// ============================================================================
// Transaction Operations
// ============================================================================

/**
 * Detect transaction type from serialized data
 * Returns type (0-4) or negative error code
 */
int primitives_tx_detect_type(const uint8_t * data, size_t data_len);

// ============================================================================
// Signature Utilities
// ============================================================================

/**
 * Normalize signature to canonical form (low-s)
 * Modifies signature in-place if needed
 * Returns true if normalization was performed
 */
bool primitives_signature_normalize(uint8_t * r, uint8_t * s);

/**
 * Check if signature is in canonical form
 */
bool primitives_signature_is_canonical(const uint8_t * r, const uint8_t * s);

/**
 * Parse signature from DER or compact format
 * Input: 64 or 65 byte signature (r + s + optional v)
 * Output: r, s, v components
 */
int primitives_signature_parse(const uint8_t * sig_data, size_t sig_len, uint8_t * out_r, uint8_t * out_s, uint8_t * out_v);

/**
 * Serialize signature to compact format (64 or 65 bytes)
 * include_v: if true, append v byte to create 65-byte signature
 */
int primitives_signature_serialize(const uint8_t * r, const uint8_t * s, uint8_t v, bool include_v, uint8_t * out_buf);

// ============================================================================
// Wallet Generation
// ============================================================================

/**
 * Generate a cryptographically secure random private key
 */
int primitives_generate_private_key(uint8_t * out_private_key);

/**
 * Compress public key from uncompressed format (64 bytes) to compressed (33 bytes)
 */
int primitives_compress_public_key(const uint8_t * uncompressed, uint8_t * out_compressed);

// ============================================================================
// Bytecode Operations
// ============================================================================

/**
 * Analyze bytecode to find valid JUMPDEST locations
 * Returns the number of valid jump destinations found
 * out_jumpdests must have space for at least max_jumpdests u32 values
 */
int primitives_bytecode_analyze_jumpdests(const uint8_t * code, size_t code_len, uint32_t * out_jumpdests, size_t max_jumpdests);

/**
 * Check if a position is at a bytecode boundary (not inside PUSH data)
 */
bool primitives_bytecode_is_boundary(const uint8_t * code, size_t code_len, uint32_t position);

/**
 * Check if a position is a valid JUMPDEST
 */
bool primitives_bytecode_is_valid_jumpdest(const uint8_t * code, size_t code_len, uint32_t position);

/**
 * Validate bytecode for basic correctness
 * Returns PRIMITIVES_SUCCESS if valid, error code otherwise
 */
int primitives_bytecode_validate(const uint8_t * code, size_t code_len);

// ============================================================================
// Solidity Packed Hashing
// ============================================================================

/**
 * Compute keccak256 of tightly packed arguments
 * This mimics Solidity's abi.encodePacked followed by keccak256
 */
int primitives_solidity_keccak256(const uint8_t * packed_data, size_t data_len, PrimitivesHash * out_hash);

/**
 * Compute SHA256 of tightly packed arguments
 */
int primitives_solidity_sha256(const uint8_t * packed_data, size_t data_len, uint8_t * out_hash);

// ============================================================================
// Additional Hash Algorithms
// ============================================================================

/**
 * Compute Blake2b hash (for EIP-152)
 */
int primitives_blake2b(const uint8_t * data, size_t data_len, uint8_t * out_hash);

/**
 * Compute BLAKE2b with a variable digest length (1..=64 bytes).
 * The length is encoded in the BLAKE2b parameter block (RFC 7693), so the
 * result is NOT a truncated BLAKE2b-512 digest.
 * Returns PRIMITIVES_ERROR_INVALID_INPUT when out_len is 0 or > 64.
 * Same symbol and signature as crypto/blake2_c.zig so the WASM loader's
 * `exports.blake2Hash` path works against the full primitives build.
 */
int blake2Hash(const uint8_t * data, size_t data_len, uint8_t * out_hash, size_t out_len);

// ============================================================================
// CREATE2 Address Calculation
// ============================================================================

/**
 * Calculate CREATE2 contract address
 * Formula: keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]
 */
int primitives_calculate_create2_address(const PrimitivesAddress * sender, const uint8_t * salt, const uint8_t * init_code, size_t init_code_len, PrimitivesAddress * out_address);

// ============================================================================
// ABI Encoding/Decoding API
// ============================================================================

/**
 * Compute function selector from signature
 * signature: null-terminated string (e.g., "transfer(address,uint256)")
 * out_selector: 4-byte buffer for selector output
 */
int primitives_abi_compute_selector(const char * signature, uint8_t * out_selector);

/**
 * Encode ABI parameters
 * types_json: JSON array of type strings, e.g., ["address","uint256","bool"]
 * values_json: JSON array of value strings, e.g., ["0x...", "42", "true"]
 * out_buf: output buffer for encoded data
 * buf_len: size of output buffer
 * Returns: number of bytes written, or negative error code
 */
int primitives_abi_encode_parameters(const char * types_json, const char * values_json, uint8_t * out_buf, size_t buf_len);

/**
 * Decode ABI parameters
 * data: encoded ABI data
 * data_len: length of encoded data
 * types_json: JSON array of type strings
 * out_buf: output buffer for JSON-encoded values
 * buf_len: size of output buffer
 * Returns: number of bytes written to out_buf, or negative error code
 */
int primitives_abi_decode_parameters(const uint8_t * data, size_t data_len, const char * types_json, uint8_t * out_buf, size_t buf_len);

/**
 * Encode function data (selector + parameters)
 * signature: function signature string (e.g., "transfer(address,uint256)")
 * types_json: JSON array of type strings
 * values_json: JSON array of value strings
 * out_buf: output buffer for encoded function data
 * buf_len: size of output buffer
 * Returns: number of bytes written, or negative error code
 */
int primitives_abi_encode_function_data(const char * signature, const char * types_json, const char * values_json, uint8_t * out_buf, size_t buf_len);

/**
 * Decode function data (extract selector and decode parameters)
 * data: encoded function data (selector + parameters)
 * data_len: length of encoded data
 * types_json: JSON array of expected parameter types
 * out_selector: output buffer for 4-byte selector
 * out_buf: output buffer for JSON-encoded parameter values
 * buf_len: size of output buffer
 * Returns: number of bytes written to out_buf, or negative error code
 */
int primitives_abi_decode_function_data(const uint8_t * data, size_t data_len, const char * types_json, uint8_t * out_selector, uint8_t * out_buf, size_t buf_len);

/**
 * Encode packed (non-standard compact encoding)
 * types_json: JSON array of type strings
 * values_json: JSON array of value strings
 * out_buf: output buffer for packed encoding
 * buf_len: size of output buffer
 * Returns: number of bytes written, or negative error code
 */
int primitives_abi_encode_packed(const char * types_json, const char * values_json, uint8_t * out_buf, size_t buf_len);

/**
 * Estimate gas cost for calldata
 * data: calldata bytes
 * data_len: length of calldata
 * Returns: estimated gas cost (u64), or negative error code
 */
long long primitives_abi_estimate_gas(const uint8_t * data, size_t data_len);

// ============================================================================
// Blob Operations (EIP-4844)
// ============================================================================

/**
 * Encode data as a field-element-safe blob (same layout as
 * `Blob.encodeBlobData` and voltaire-ts `Blob.fromData`): byte 0 of every
 * 32-byte field element is 0x00, the usable stream starts with a 4-byte
 * big-endian length prefix, and at most `MAX_DATA_PER_BLOB` (126972) bytes fit.
 * out_blob must hold BYTES_PER_BLOB (131072) bytes.
 * Returns PRIMITIVES_SUCCESS on success
 */
int primitives_blob_from_data(const uint8_t * data, size_t data_len, uint8_t * out_blob);

/**
 * Decode a blob written by `primitives_blob_from_data` / `Blob.encodeBlobData`.
 * blob must hold BYTES_PER_BLOB bytes; out_data must hold MAX_DATA_PER_BLOB
 * (126972) bytes. Writes the data length to out_len.
 * Returns PRIMITIVES_SUCCESS or a negative error code
 */
int primitives_blob_to_data(const uint8_t * blob, uint8_t * out_data, size_t * out_len);

/**
 * Validate blob size
 * Returns 1 if valid, 0 if invalid
 */
int primitives_blob_is_valid(size_t blob_len);

/**
 * Calculate blob gas for number of blobs
 * Returns total blob gas
 */
uint64_t primitives_blob_calculate_gas(uint32_t blob_count);

/**
 * Estimate number of blobs needed for data size
 * Returns number of blobs required
 */
uint32_t primitives_blob_estimate_count(size_t data_size);

/**
 * Calculate blob gas price from excess blob gas
 * Returns blob gas price
 */
uint64_t primitives_blob_calculate_gas_price(uint64_t excess_blob_gas);

/**
 * Calculate excess blob gas for next block
 * Returns excess blob gas
 */
uint64_t primitives_blob_calculate_excess_gas(uint64_t parent_excess, uint64_t parent_used);

// ============================================================================
// Event Log Operations
// ============================================================================

/**
 * Check if event log matches address filter
 * Returns 1 if matches, 0 if not
 */
int primitives_eventlog_matches_address(const uint8_t * log_address, const uint8_t * filter_addresses, size_t filter_count);

/**
 * Check if event log matches single topic filter
 * null_topic: 1 if topic filter is null (match any), 0 otherwise
 * Returns 1 if matches, 0 if not
 */
int primitives_eventlog_matches_topic(const uint8_t * log_topic, const uint8_t * filter_topic, int null_topic);

/**
 * Check if log matches topic array filter
 * Returns 1 if matches, 0 if not
 */
int primitives_eventlog_matches_topics(const uint8_t * log_topics, size_t log_topic_count, const uint8_t * filter_topics, const int * filter_nulls, size_t filter_count);

// ============================================================================
// Version info
// ============================================================================

const char * primitives_version_string(void);

// ============================================================================
// Access List API (EIP-2930)
// ============================================================================

/**
 * Calculate gas cost for access list
 * entries: array of access list entries
 * entries_len: number of entries
 * out_cost: output for total gas cost
 */
int primitives_access_list_gas_cost(const PrimitivesAccessListEntry * entries, size_t entries_len, uint64_t * out_cost);

// ============================================================================
// Access List API (EIP-2930) - Structures
// ============================================================================

// ============================================================================
// Authorization API (EIP-7702)
// ============================================================================

/**
 * Validate authorization structure
 */
int primitives_authorization_validate(const PrimitivesAuthorization * auth_ptr);

/**
 * Calculate authorization signing hash
 */
int primitives_authorization_signing_hash(uint64_t chain_id, const PrimitivesAddress * address_ptr, uint64_t nonce, PrimitivesHash * out_hash);

/**
 * Recover authority (signer) from authorization
 */
int primitives_authorization_authority(const PrimitivesAuthorization * auth_ptr, PrimitivesAddress * out_address);

/**
 * Calculate gas cost for authorization list
 */
uint64_t primitives_authorization_gas_cost(size_t count, size_t empty_accounts);

// ============================================================================
// ============================================================================
// ============================================================================

/**
 * Encrypt with AES-128-GCM
 */
int aesGcm128Encrypt(const uint8_t * plaintext_ptr, size_t plaintext_len, const uint8_t * key_ptr, const uint8_t * nonce_ptr, const uint8_t * ad_ptr, size_t ad_len, uint8_t * out_ptr);

/**
 * Decrypt with AES-128-GCM
 */
int aesGcm128Decrypt(const uint8_t * ciphertext_ptr, size_t ciphertext_len, const uint8_t * key_ptr, const uint8_t * nonce_ptr, const uint8_t * ad_ptr, size_t ad_len, uint8_t * out_ptr);

/**
 * Encrypt with AES-256-GCM
 */
int aesGcm256Encrypt(const uint8_t * plaintext_ptr, size_t plaintext_len, const uint8_t * key_ptr, const uint8_t * nonce_ptr, const uint8_t * ad_ptr, size_t ad_len, uint8_t * out_ptr);

/**
 * Decrypt with AES-256-GCM
 */
int aesGcm256Decrypt(const uint8_t * ciphertext_ptr, size_t ciphertext_len, const uint8_t * key_ptr, const uint8_t * nonce_ptr, const uint8_t * ad_ptr, size_t ad_len, uint8_t * out_ptr);

// ============================================================================
// X25519 API
// ============================================================================

/**
 * Derive X25519 public key from secret key
 */
int x25519DerivePublicKey(const uint8_t * secret_ptr, uint8_t * pub_ptr);

/**
 * Perform X25519 scalar multiplication (ECDH)
 */
int x25519Scalarmult(const uint8_t * secret_ptr, const uint8_t * pub_ptr, uint8_t * shared_ptr);

/**
 * Generate X25519 keypair from seed
 */
int x25519KeypairFromSeed(const uint8_t * seed_ptr, uint8_t * secret_ptr, uint8_t * pub_ptr);

// ============================================================================
// Ed25519 API
// ============================================================================

/**
 * Sign a message with Ed25519
 * message: message to sign
 * message_len: length of message
 * secret_key: 64-byte secret key
 * out_signature: 64-byte output buffer for signature
 * Returns 0 on success, negative error code on failure
 */
int ed25519Sign(const uint8_t * message, size_t message_len, const uint8_t * secret_key, uint8_t * out_signature);

/**
 * Verify an Ed25519 signature
 * message: message that was signed
 * message_len: length of message
 * signature: 64-byte signature
 * public_key: 32-byte public key
 * Returns 0 if valid, 1 if invalid, negative on error
 */
int ed25519Verify(const uint8_t * message, size_t message_len, const uint8_t * signature, const uint8_t * public_key);

/**
 * Derive Ed25519 public key from secret key
 * secret_key: 64-byte secret key
 * out_public_key: 32-byte output buffer for public key
 * Returns 0 on success, negative error code on failure
 */
int ed25519DerivePublicKey(const uint8_t * secret_key, uint8_t * out_public_key);

// ============================================================================
// P256 (secp256r1) API
// ============================================================================

/**
 * Sign a hash with P256
 * hash: 32-byte hash to sign
 * private_key: 32-byte private key
 * out_signature: 64-byte output buffer for signature (r || s)
 * Returns 0 on success, negative error code on failure
 */
int p256Sign(const uint8_t * hash, const uint8_t * private_key, uint8_t * out_signature);

/**
 * Verify a P256 signature
 * hash: 32-byte hash that was signed
 * signature: 64-byte signature (r || s)
 * public_key: 64-byte uncompressed public key (x || y)
 * Returns 0 if valid, 1 if invalid, negative on error
 */
int p256Verify(const uint8_t * hash, const uint8_t * signature, const uint8_t * public_key);

/**
 * Derive P256 public key from private key
 * private_key: 32-byte private key
 * out_public_key: 64-byte output buffer for uncompressed public key (x || y)
 * Returns 0 on success, negative error code on failure
 */
int p256DerivePublicKey(const uint8_t * private_key, uint8_t * out_public_key);

/**
 * Perform P256 ECDH key exchange
 * private_key: 32-byte private key
 * public_key: 64-byte uncompressed public key (x || y)
 * out_shared: 32-byte output buffer for shared secret
 * Returns 0 on success, negative error code on failure
 */
int p256Ecdh(const uint8_t * private_key, const uint8_t * public_key, uint8_t * out_shared);

// ============================================================================
// HD Wallet (BIP-39 / BIP-32) API - libwally-core bindings
// ============================================================================

/**
 * Generate BIP-39 mnemonic from entropy
 * entropy_len: 16 (128 bits) or 32 (256 bits)
 * out_mnemonic: must be large enough (at least 256 bytes)
 * Returns length of mnemonic string or negative error code
 */
int hdwallet_generate_mnemonic(const uint8_t * entropy, size_t entropy_len, uint8_t * out_mnemonic, size_t out_len);

/**
 * Convert BIP-39 mnemonic to seed (512 bits)
 * passphrase: optional, pass NULL if not needed
 */
int hdwallet_mnemonic_to_seed(const char * mnemonic, const char * passphrase, uint8_t * out_seed);

/**
 * Validate BIP-39 mnemonic checksum
 * Returns 1 if valid, 0 if invalid
 */
int hdwallet_validate_mnemonic(const char * mnemonic);

/**
 * Create HD root key from seed
 * Returns opaque handle to HD key or 0 on error
 */
size_t hdwallet_from_seed(const uint8_t * seed, size_t seed_len);

/**
 * Derive child key from path
 * path: array of u32 child indices (use 0x80000000 + index for hardened)
 * Returns opaque handle to derived HD key or 0 on error
 */
size_t hdwallet_derive(size_t hdkey_handle, const uint32_t * path, size_t path_len);

/**
 * Get private key from HD key
 */
int hdwallet_get_private_key(size_t hdkey_handle, uint8_t * out_private_key);

/**
 * Get public key from HD key
 */
int hdwallet_get_public_key(size_t hdkey_handle, uint8_t * out_public_key);

/**
 * Get Ethereum address from HD key
 */
int hdwallet_get_address(size_t hdkey_handle, PrimitivesAddress * out_address);

/**
 * Free HD key
 */
int hdwallet_free(size_t hdkey_handle);

// ============================================================================
// WASM Memory Management
// ============================================================================

// ============================================================================
// Bytecode Advanced Analysis API
// ============================================================================

/**
 * Get next PC after current instruction
 * Returns next PC position or -1 if at end of bytecode
 */
int64_t primitives_bytecode_get_next_pc(const uint8_t * code, size_t code_len, uint32_t current_pc);

/**
 * Scan bytecode and collect all instructions in a range
 * Returns number of instructions found or negative error code
 */
int primitives_bytecode_scan(const uint8_t * code, size_t code_len, uint32_t start_pc, uint32_t end_pc, uint8_t * out_instructions, size_t * out_len);

/**
 * Detect instruction fusion patterns (optimizable instruction sequences)
 * Returns number of fusion patterns found
 */
int primitives_bytecode_detect_fusions(const uint8_t * code, size_t code_len, uint8_t * out_fusions, size_t * out_len);

// ============================================================================
// KZG Commitments API (EIP-4844)
// ============================================================================

/**
 * Load trusted setup from embedded data
 * Must be called before any KZG operations
 * Returns PRIMITIVES_SUCCESS on success
 */
int kzg_load_trusted_setup(void);

/**
 * Free trusted setup
 */
int kzg_free_trusted_setup(void);

/**
 * Convert blob to KZG commitment
 * blob: pointer to 131072-byte blob
 * out_commitment: pointer to 48-byte output buffer
 */
int kzg_blob_to_commitment(const uint8_t * blob, uint8_t * out_commitment);

/**
 * Compute KZG proof at evaluation point z
 * blob: pointer to 131072-byte blob
 * z: pointer to 32-byte evaluation point
 * out_proof: pointer to 48-byte proof output
 * out_y: pointer to 32-byte y value output
 */
int kzg_compute_proof(const uint8_t * blob, const uint8_t * z, uint8_t * out_proof, uint8_t * out_y);

/**
 * Compute blob KZG proof
 * blob: pointer to 131072-byte blob
 * commitment: pointer to 48-byte commitment
 * out_proof: pointer to 48-byte proof output
 */
int kzg_compute_blob_proof(const uint8_t * blob, const uint8_t * commitment, uint8_t * out_proof);

/**
 * Verify KZG proof
 * commitment: pointer to 48-byte commitment
 * z: pointer to 32-byte evaluation point
 * y: pointer to 32-byte y value
 * proof: pointer to 48-byte proof
 * Returns 1 if valid, 0 if invalid, negative on error
 */
int kzg_verify_proof(const uint8_t * commitment, const uint8_t * z, const uint8_t * y, const uint8_t * proof);

/**
 * Verify blob KZG proof
 * blob: pointer to 131072-byte blob
 * commitment: pointer to 48-byte commitment
 * proof: pointer to 48-byte proof
 * Returns 1 if valid, 0 if invalid, negative on error
 */
int kzg_verify_blob_proof(const uint8_t * blob, const uint8_t * commitment, const uint8_t * proof);

// ============================================================================
// C API tests
// ============================================================================


#ifdef __cplusplus
}
#endif

#endif /* PRIMITIVES_H */
