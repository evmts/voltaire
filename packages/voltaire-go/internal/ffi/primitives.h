/**
 * Voltaire Primitives C API - Go Bindings
 * Subset of primitives.h with corrected C syntax
 */

#ifndef VOLTAIRE_GO_PRIMITIVES_H
#define VOLTAIRE_GO_PRIMITIVES_H

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

typedef struct {
    uint8_t bytes[20];
} PrimitivesAddress;

typedef struct {
    uint8_t bytes[32];
} PrimitivesHash;

typedef struct {
    uint8_t bytes[32];
} PrimitivesU256;

typedef struct {
    uint8_t r[32];
    uint8_t s[32];
    uint8_t v;
} PrimitivesSignature;

// ============================================================================
// Address API
// ============================================================================

int primitives_address_from_hex(const char * hex, PrimitivesAddress * out_address);
int primitives_address_to_hex(const PrimitivesAddress * address, uint8_t * buf);
int primitives_address_to_checksum_hex(const PrimitivesAddress * address, uint8_t * buf);
bool primitives_address_is_zero(const PrimitivesAddress * address);
bool primitives_address_equals(const PrimitivesAddress * a, const PrimitivesAddress * b);
bool primitives_address_validate_checksum(const char * hex);

// ============================================================================
// Keccak-256 API
// ============================================================================

int primitives_keccak256(const uint8_t * data, size_t data_len, PrimitivesHash * out_hash);
int primitives_hash_to_hex(const PrimitivesHash * hash, uint8_t * buf);
int primitives_hash_from_hex(const char * hex, PrimitivesHash * out_hash);
bool primitives_hash_equals(const PrimitivesHash * a, const PrimitivesHash * b);

// ============================================================================
// Hex utilities API
// ============================================================================

int primitives_hex_to_bytes(const char * hex, uint8_t * out_buf, size_t buf_len);
int primitives_bytes_to_hex(const uint8_t * data, size_t data_len, uint8_t * out_buf, size_t buf_len);

// ============================================================================
// U256 utilities API
// ============================================================================

int primitives_u256_from_hex(const char * hex, PrimitivesU256 * out_u256);
int primitives_u256_to_hex(const PrimitivesU256 * value_u256, uint8_t * buf, size_t buf_len);

// ============================================================================
// Hash Algorithms
// ============================================================================

int primitives_sha256(const uint8_t * data, size_t data_len, uint8_t * out_hash);
int primitives_ripemd160(const uint8_t * data, size_t data_len, uint8_t * out_hash);
int primitives_blake2b(const uint8_t * data, size_t data_len, uint8_t * out_hash);

// ============================================================================
// Version
// ============================================================================

const char * primitives_version_string(void);

#ifdef __cplusplus
}
#endif

#endif /* VOLTAIRE_GO_PRIMITIVES_H */
