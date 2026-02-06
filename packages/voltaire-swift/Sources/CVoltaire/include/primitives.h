/**
 * Voltaire Swift C API
 *
 * Clean C header for Swift interop (subset of full primitives.h)
 */

#ifndef VOLTAIRE_SWIFT_H
#define VOLTAIRE_SWIFT_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

// ============================================================================
// Error Codes
// ============================================================================

#define PRIMITIVES_SUCCESS 0
#define PRIMITIVES_ERROR_INVALID_HEX -1
#define PRIMITIVES_ERROR_INVALID_LENGTH -2
#define PRIMITIVES_ERROR_INVALID_CHECKSUM -3
#define PRIMITIVES_ERROR_OUT_OF_MEMORY -4
#define PRIMITIVES_ERROR_INVALID_INPUT -5
#define PRIMITIVES_ERROR_INVALID_SIGNATURE -6
#define PRIMITIVES_ERROR_INVALID_SELECTOR -7
#define PRIMITIVES_ERROR_UNSUPPORTED_TYPE -8
#define PRIMITIVES_ERROR_MAX_LENGTH_EXCEEDED -9
#define PRIMITIVES_ERROR_ACCESS_LIST_INVALID -10
#define PRIMITIVES_ERROR_AUTHORIZATION_INVALID -11

// ============================================================================
// Types
// ============================================================================

/** Ethereum address (20 bytes) */
typedef struct {
    uint8_t bytes[20];
} PrimitivesAddress;

/** Hash value (32 bytes) */
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

// ============================================================================
// Address API
// ============================================================================

/** Create address from hex string (with or without 0x prefix) */
int primitives_address_from_hex(const char* hex, PrimitivesAddress* out_address);

/** Convert address to hex string (buf must be at least 43 bytes) */
int primitives_address_to_hex(const PrimitivesAddress* address, char* buf);

/** Convert address to checksummed hex (EIP-55, buf must be at least 43 bytes) */
int primitives_address_to_checksum_hex(const PrimitivesAddress* address, char* buf);

/** Check if address is zero address */
bool primitives_address_is_zero(const PrimitivesAddress* address);

/** Compare two addresses for equality */
bool primitives_address_equals(const PrimitivesAddress* a, const PrimitivesAddress* b);

/** Validate EIP-55 checksum */
bool primitives_address_validate_checksum(const char* hex);

// ============================================================================
// Keccak-256 API
// ============================================================================

/** Compute Keccak-256 hash of input data */
int primitives_keccak256(const uint8_t* data, size_t data_len, PrimitivesHash* out_hash);

/** Convert hash to hex string (buf must be at least 67 bytes) */
int primitives_hash_to_hex(const PrimitivesHash* hash, char* buf);

/** Create hash from hex string */
int primitives_hash_from_hex(const char* hex, PrimitivesHash* out_hash);

/** Compare two hashes for equality (constant-time) */
bool primitives_hash_equals(const PrimitivesHash* a, const PrimitivesHash* b);

// ============================================================================
// Address Derivation (CREATE/CREATE2)
// ============================================================================

/** Calculate CREATE contract address from sender and nonce */
int primitives_calculate_create_address(const PrimitivesAddress* sender,
                                        uint64_t nonce,
                                        PrimitivesAddress* out_address);

/** Calculate CREATE2 contract address from sender, salt, and init code */
int primitives_calculate_create2_address(const PrimitivesAddress* sender,
                                         const uint8_t* salt32,
                                         const uint8_t* init_code,
                                         size_t init_code_len,
                                         PrimitivesAddress* out_address);

// ============================================================================
// Hex Utilities API
// ============================================================================

/** Convert hex string to bytes. Returns byte count or negative error. */
int primitives_hex_to_bytes(const char* hex, uint8_t* out_buf, size_t buf_len);

/** Convert bytes to hex string. Returns char count or negative error. */
int primitives_bytes_to_hex(const uint8_t* data, size_t data_len, char* out_buf, size_t buf_len);

// ============================================================================
// U256 API
// ============================================================================

/** Parse u256 from hex string */
int primitives_u256_from_hex(const char* hex, PrimitivesU256* out_u256);

/** Convert u256 to hex string (buf must be at least 67 bytes including NUL) */
int primitives_u256_to_hex(const PrimitivesU256* value_u256, char* buf, size_t buf_len);

// ============================================================================
// Signature Utilities
// ============================================================================

/** Normalize signature to canonical form (low-s); returns 1 if modified */
bool primitives_signature_normalize(uint8_t* r, uint8_t* s);

/** Check if signature is canonical (low-s) */
bool primitives_signature_is_canonical(const uint8_t* r, const uint8_t* s);

/** Parse signature from compact data (64 or 65 bytes) into r,s,v */
int primitives_signature_parse(const uint8_t* sig_data, size_t sig_len,
                               uint8_t* out_r, uint8_t* out_s, uint8_t* out_v);

/** Serialize signature to compact form (64 or 65 bytes) */
int primitives_signature_serialize(const uint8_t* r, const uint8_t* s, uint8_t v,
                                   bool include_v, uint8_t* out_buf);

// ============================================================================
// Secp256k1 (ECDSA) API
// ============================================================================

/** Recover public key (uncompressed 64 bytes) from message hash and signature */
int primitives_secp256k1_recover_pubkey(const uint8_t* message_hash,
                                        const uint8_t* r,
                                        const uint8_t* s,
                                        uint8_t v,
                                        uint8_t* out_pubkey);

/** Recover Ethereum address from message hash and signature */
int primitives_secp256k1_recover_address(const uint8_t* message_hash,
                                         const uint8_t* r,
                                         const uint8_t* s,
                                         uint8_t v,
                                         PrimitivesAddress* out_address);

/** Derive public key (uncompressed 64 bytes) from private key (32 bytes) */
int primitives_secp256k1_pubkey_from_private(const uint8_t* private_key,
                                             uint8_t* out_pubkey);

/** Validate signature components r and s are within curve order */
bool primitives_secp256k1_validate_signature(const uint8_t* r, const uint8_t* s);

/** Compress uncompressed public key (64 bytes) into 33-byte SEC1 form */
int primitives_compress_public_key(const uint8_t* uncompressed,
                                   uint8_t* out_compressed);

/** Generate a random valid private key (32 bytes) */
int primitives_generate_private_key(uint8_t* out_private_key);
/* (deduplicated declarations removed) */

// ============================================================================
// Message Hashing (EIP-191)
// ============================================================================

/** Hash message with EIP-191 personal sign format */
int primitives_eip191_hash_message(const uint8_t* message, size_t message_len, PrimitivesHash* out_hash);

#ifdef __cplusplus
}
#endif

#endif /* VOLTAIRE_SWIFT_H */
