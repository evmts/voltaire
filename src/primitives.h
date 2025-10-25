/**
 * Primitives C API
 *
 * C bindings for Ethereum primitives library
 * Provides address operations, hashing, hex utilities, and more.
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

// ============================================================================
// Address API
// ============================================================================

/**
 * Create address from hex string (with or without 0x prefix)
 *
 * @param hex Null-terminated hex string (e.g., "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")
 * @param out_address Output address structure
 * @return PRIMITIVES_SUCCESS on success, error code otherwise
 */
int primitives_address_from_hex(
    const char *hex,
    PrimitivesAddress *out_address
);

/**
 * Convert address to hex string (42 bytes: "0x" + 40 hex chars)
 *
 * @param address Input address
 * @param buf Output buffer (must be at least 42 bytes)
 * @return PRIMITIVES_SUCCESS on success, error code otherwise
 */
int primitives_address_to_hex(
    const PrimitivesAddress *address,
    uint8_t *buf
);

/**
 * Convert address to checksummed hex (EIP-55)
 *
 * @param address Input address
 * @param buf Output buffer (must be at least 42 bytes)
 * @return PRIMITIVES_SUCCESS on success, error code otherwise
 */
int primitives_address_to_checksum_hex(
    const PrimitivesAddress *address,
    uint8_t *buf
);

/**
 * Check if address is the zero address
 *
 * @param address Input address
 * @return true if zero address, false otherwise
 */
bool primitives_address_is_zero(
    const PrimitivesAddress *address
);

/**
 * Compare two addresses for equality
 *
 * @param a First address
 * @param b Second address
 * @return true if equal, false otherwise
 */
bool primitives_address_equals(
    const PrimitivesAddress *a,
    const PrimitivesAddress *b
);

/**
 * Validate EIP-55 checksum
 *
 * @param hex Null-terminated hex string with checksum
 * @return true if valid checksum, false otherwise
 */
bool primitives_address_validate_checksum(
    const char *hex
);

// ============================================================================
// Keccak-256 API
// ============================================================================

/**
 * Compute Keccak-256 hash of input data
 *
 * @param data Input data
 * @param data_len Length of input data in bytes
 * @param out_hash Output hash structure
 * @return PRIMITIVES_SUCCESS on success, error code otherwise
 */
int primitives_keccak256(
    const uint8_t *data,
    size_t data_len,
    PrimitivesHash *out_hash
);

/**
 * Convert hash to hex string (66 bytes: "0x" + 64 hex chars)
 *
 * @param hash Input hash
 * @param buf Output buffer (must be at least 66 bytes)
 * @return PRIMITIVES_SUCCESS on success, error code otherwise
 */
int primitives_hash_to_hex(
    const PrimitivesHash *hash,
    uint8_t *buf
);

/**
 * Create hash from hex string
 *
 * @param hex Null-terminated hex string
 * @param out_hash Output hash structure
 * @return PRIMITIVES_SUCCESS on success, error code otherwise
 */
int primitives_hash_from_hex(
    const char *hex,
    PrimitivesHash *out_hash
);

/**
 * Compare two hashes for equality (constant-time)
 *
 * @param a First hash
 * @param b Second hash
 * @return true if equal, false otherwise
 */
bool primitives_hash_equals(
    const PrimitivesHash *a,
    const PrimitivesHash *b
);

// ============================================================================
// Hex Utilities API
// ============================================================================

/**
 * Convert hex string to bytes
 *
 * @param hex Null-terminated hex string
 * @param out_buf Output buffer
 * @param buf_len Size of output buffer
 * @return Number of bytes written on success, negative error code otherwise
 */
int primitives_hex_to_bytes(
    const char *hex,
    uint8_t *out_buf,
    size_t buf_len
);

/**
 * Convert bytes to hex string
 *
 * @param data Input data
 * @param data_len Length of input data
 * @param out_buf Output buffer
 * @param buf_len Size of output buffer (must be at least 2 + data_len*2)
 * @return Number of characters written (including "0x" prefix) on success, negative error code otherwise
 */
int primitives_bytes_to_hex(
    const uint8_t *data,
    size_t data_len,
    uint8_t *out_buf,
    size_t buf_len
);

// ============================================================================
// U256 Utilities API
// ============================================================================

/**
 * Parse u256 from hex string
 *
 * @param hex Null-terminated hex string
 * @param out_u256 Output U256 structure
 * @return PRIMITIVES_SUCCESS on success, error code otherwise
 */
int primitives_u256_from_hex(
    const char *hex,
    PrimitivesU256 *out_u256
);

/**
 * Convert u256 to hex string (66 bytes: "0x" + 64 hex chars)
 *
 * @param value_u256 Input U256 value
 * @param buf Output buffer
 * @param buf_len Size of output buffer (must be at least 66 bytes)
 * @return PRIMITIVES_SUCCESS on success, error code otherwise
 */
int primitives_u256_to_hex(
    const PrimitivesU256 *value_u256,
    uint8_t *buf,
    size_t buf_len
);

// ============================================================================
// EIP-191 Personal Message Signing
// ============================================================================

/**
 * Hash a message using EIP-191 personal message format
 *
 * The message is prefixed with "\x19Ethereum Signed Message:\n{length}"
 * before hashing with Keccak-256.
 *
 * @param message Input message
 * @param message_len Length of message in bytes
 * @param out_hash Output hash structure
 * @return PRIMITIVES_SUCCESS on success, error code otherwise
 */
int primitives_eip191_hash_message(
    const uint8_t *message,
    size_t message_len,
    PrimitivesHash *out_hash
);

// ============================================================================
// Address Derivation
// ============================================================================

/**
 * Calculate CREATE contract address (from sender and nonce)
 *
 * Computes the address of a contract deployed using the CREATE opcode,
 * which is: keccak256(rlp([sender, nonce]))[12:]
 *
 * @param sender Sender address
 * @param nonce Transaction nonce
 * @param out_address Output contract address
 * @return PRIMITIVES_SUCCESS on success, error code otherwise
 */
int primitives_calculate_create_address(
    const PrimitivesAddress *sender,
    uint64_t nonce,
    PrimitivesAddress *out_address
);

// ============================================================================
// Version Info
// ============================================================================

/**
 * Get library version string
 *
 * @return Null-terminated version string
 */
const char *primitives_version_string(void);

#ifdef __cplusplus
}
#endif

#endif /* PRIMITIVES_H */
