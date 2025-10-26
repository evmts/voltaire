/*
 * C API for Ethereum Primitives Library
 *
 * This header provides C bindings to the Zig primitives implementation
 * for use with Swift and other FFI consumers.
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

#define PRIMITIVES_SUCCESS 0
#define PRIMITIVES_ERROR_INVALID_HEX -1
#define PRIMITIVES_ERROR_INVALID_LENGTH -2
#define PRIMITIVES_ERROR_INVALID_CHECKSUM -3
#define PRIMITIVES_ERROR_OUT_OF_MEMORY -4
#define PRIMITIVES_ERROR_INVALID_INPUT -5
#define PRIMITIVES_ERROR_INVALID_SIGNATURE -6

// ============================================================================
// C-compatible types
// ============================================================================

/// Ethereum address (20 bytes)
typedef struct {
    uint8_t bytes[20];
} PrimitivesAddress;

/// Hash/digest (32 bytes)
typedef struct {
    uint8_t bytes[32];
} PrimitivesHash;

/// 256-bit unsigned integer (32 bytes, big-endian)
typedef struct {
    uint8_t bytes[32];
} PrimitivesU256;

// ============================================================================
// Address API
// ============================================================================

/// Create address from hex string (with or without 0x prefix)
/// @param hex Null-terminated hex string (42 characters with 0x prefix)
/// @param out_address Pointer to output address structure
/// @return PRIMITIVES_SUCCESS on success, error code otherwise
int primitives_address_from_hex(const char *hex, PrimitivesAddress *out_address);

/// Convert address to hex string (42 bytes: "0x" + 40 hex chars)
/// @param address Pointer to address structure
/// @param buf Output buffer (must be at least 42 bytes)
/// @return PRIMITIVES_SUCCESS on success, error code otherwise
int primitives_address_to_hex(const PrimitivesAddress *address, uint8_t *buf);

/// Convert address to checksummed hex (EIP-55)
/// @param address Pointer to address structure
/// @param buf Output buffer (must be at least 42 bytes)
/// @return PRIMITIVES_SUCCESS on success, error code otherwise
int primitives_address_to_checksum_hex(const PrimitivesAddress *address, uint8_t *buf);

/// Check if address is zero address
/// @param address Pointer to address structure
/// @return true if zero address, false otherwise
bool primitives_address_is_zero(const PrimitivesAddress *address);

/// Compare two addresses for equality
/// @param a First address
/// @param b Second address
/// @return true if equal, false otherwise
bool primitives_address_equals(const PrimitivesAddress *a, const PrimitivesAddress *b);

/// Validate EIP-55 checksum
/// @param hex Null-terminated hex string to validate
/// @return true if valid checksum, false otherwise
bool primitives_address_validate_checksum(const char *hex);

// ============================================================================
// Keccak-256 API
// ============================================================================

/// Compute Keccak-256 hash of input data
/// @param data Input data buffer
/// @param data_len Length of input data
/// @param out_hash Pointer to output hash structure
/// @return PRIMITIVES_SUCCESS on success, error code otherwise
int primitives_keccak256(const uint8_t *data, size_t data_len, PrimitivesHash *out_hash);

// ============================================================================
// Hash utilities API
// ============================================================================

/// Convert hash to hex string (66 bytes: "0x" + 64 hex chars)
/// @param hash Pointer to hash structure
/// @param buf Output buffer (must be at least 66 bytes)
/// @return PRIMITIVES_SUCCESS on success, error code otherwise
int primitives_hash_to_hex(const PrimitivesHash *hash, uint8_t *buf);

/// Create hash from hex string
/// @param hex Null-terminated hex string (66 characters with 0x prefix)
/// @param out_hash Pointer to output hash structure
/// @return PRIMITIVES_SUCCESS on success, error code otherwise
int primitives_hash_from_hex(const char *hex, PrimitivesHash *out_hash);

/// Compare two hashes for equality (constant-time)
/// @param a First hash
/// @param b Second hash
/// @return true if equal, false otherwise
bool primitives_hash_equals(const PrimitivesHash *a, const PrimitivesHash *b);

// ============================================================================
// Hex utilities API
// ============================================================================

/// Convert hex string to bytes
/// @param hex Null-terminated hex string
/// @param out_buf Output buffer
/// @param buf_len Length of output buffer
/// @return Number of bytes written on success, negative error code otherwise
int primitives_hex_to_bytes(const char *hex, uint8_t *out_buf, size_t buf_len);

/// Convert bytes to hex string
/// @param data Input data buffer
/// @param data_len Length of input data
/// @param out_buf Output buffer
/// @param buf_len Length of output buffer
/// @return Number of characters written on success, negative error code otherwise
int primitives_bytes_to_hex(const uint8_t *data, size_t data_len, uint8_t *out_buf, size_t buf_len);

// ============================================================================
// U256 utilities API
// ============================================================================

/// Parse u256 from hex string
/// @param hex Null-terminated hex string
/// @param out_u256 Pointer to output u256 structure
/// @return PRIMITIVES_SUCCESS on success, error code otherwise
int primitives_u256_from_hex(const char *hex, PrimitivesU256 *out_u256);

/// Convert u256 to hex string (66 bytes: "0x" + 64 hex chars)
/// @param value_u256 Pointer to u256 structure
/// @param buf Output buffer
/// @param buf_len Length of output buffer (must be at least 66 bytes)
/// @return PRIMITIVES_SUCCESS on success, error code otherwise
int primitives_u256_to_hex(const PrimitivesU256 *value_u256, uint8_t *buf, size_t buf_len);

// ============================================================================
// EIP-191 Personal Message Signing
// ============================================================================

/// Hash a message using EIP-191 personal message format
/// @param message Input message buffer
/// @param message_len Length of input message
/// @param out_hash Pointer to output hash structure
/// @return PRIMITIVES_SUCCESS on success, error code otherwise
int primitives_eip191_hash_message(const uint8_t *message, size_t message_len, PrimitivesHash *out_hash);

// ============================================================================
// Address derivation
// ============================================================================

/// Calculate CREATE contract address (from sender and nonce)
/// @param sender Sender address
/// @param nonce Transaction nonce
/// @param out_address Pointer to output address structure
/// @return PRIMITIVES_SUCCESS on success, error code otherwise
int primitives_calculate_create_address(const PrimitivesAddress *sender, uint64_t nonce, PrimitivesAddress *out_address);

#ifdef __cplusplus
}
#endif

#endif /* PRIMITIVES_H */
