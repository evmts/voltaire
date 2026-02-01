/**
 * Basic C API usage example for primitives library
 *
 * Demonstrates:
 * - Address creation and conversion
 * - Keccak-256 hashing
 * - Hex encoding/decoding
 * - U256 operations
 */

#include <stdio.h>
#include <string.h>
#include "primitives.h"

void print_bytes(const char* label, const uint8_t* bytes, size_t len) {
    printf("%s: 0x", label);
    for (size_t i = 0; i < len; i++) {
        printf("%02x", bytes[i]);
    }
    printf("\n");
}

int main(void) {
    printf("=== Primitives C API Example ===\n");
    printf("Version: %s\n\n", primitives_version_string());

    // ========================================================================
    // Address operations
    // ========================================================================
    printf("--- Address Operations ---\n");

    PrimitivesAddress addr;
    const char* addr_hex = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

    int result = primitives_address_from_hex(addr_hex, &addr);
    if (result != PRIMITIVES_SUCCESS) {
        printf("Error: Failed to parse address: %d\n", result);
        return 1;
    }

    print_bytes("Address bytes", addr.bytes, 20);

    // Convert back to hex
    char hex_buf[42];
    result = primitives_address_to_hex(&addr, (uint8_t*)hex_buf);
    if (result != PRIMITIVES_SUCCESS) {
        printf("Error: Failed to convert to hex: %d\n", result);
        return 1;
    }
    printf("Address hex: %.*s\n", 42, hex_buf);

    // Checksummed hex
    char checksum_buf[42];
    result = primitives_address_to_checksum_hex(&addr, (uint8_t*)checksum_buf);
    if (result != PRIMITIVES_SUCCESS) {
        printf("Error: Failed to convert to checksum hex: %d\n", result);
        return 1;
    }
    printf("Checksummed: %.*s\n", 42, checksum_buf);

    // Validate checksum
    bool valid = primitives_address_validate_checksum(addr_hex);
    printf("Checksum valid: %s\n", valid ? "true" : "false");

    // Check if zero address
    bool is_zero = primitives_address_is_zero(&addr);
    printf("Is zero address: %s\n\n", is_zero ? "true" : "false");

    // ========================================================================
    // Keccak-256 hashing
    // ========================================================================
    printf("--- Keccak-256 Hashing ---\n");

    const char* message = "Hello, Ethereum!";
    PrimitivesHash hash;

    result = primitives_keccak256((const uint8_t*)message, strlen(message), &hash);
    if (result != PRIMITIVES_SUCCESS) {
        printf("Error: Failed to hash: %d\n", result);
        return 1;
    }

    print_bytes("Hash bytes", hash.bytes, 32);

    // Convert hash to hex
    char hash_hex[66];
    result = primitives_hash_to_hex(&hash, (uint8_t*)hash_hex);
    if (result != PRIMITIVES_SUCCESS) {
        printf("Error: Failed to convert hash to hex: %d\n", result);
        return 1;
    }
    printf("Hash hex: %.*s\n\n", 66, hash_hex);

    // ========================================================================
    // EIP-191 personal message signing
    // ========================================================================
    printf("--- EIP-191 Message Hashing ---\n");

    const char* personal_msg = "Sign this message";
    PrimitivesHash eip191_hash;

    result = primitives_eip191_hash_message(
        (const uint8_t*)personal_msg,
        strlen(personal_msg),
        &eip191_hash
    );
    if (result != PRIMITIVES_SUCCESS) {
        printf("Error: Failed to hash EIP-191 message: %d\n", result);
        return 1;
    }

    char eip191_hex[66];
    result = primitives_hash_to_hex(&eip191_hash, (uint8_t*)eip191_hex);
    if (result != PRIMITIVES_SUCCESS) {
        printf("Error: Failed to convert EIP-191 hash to hex: %d\n", result);
        return 1;
    }
    printf("EIP-191 hash: %.*s\n\n", 66, eip191_hex);

    // ========================================================================
    // Hex utilities
    // ========================================================================
    printf("--- Hex Utilities ---\n");

    const char* test_data = "Hello";
    uint8_t hex_result[128];

    result = primitives_bytes_to_hex(
        (const uint8_t*)test_data,
        strlen(test_data),
        hex_result,
        128
    );
    if (result < 0) {
        printf("Error: Failed to encode hex: %d\n", result);
        return 1;
    }
    printf("Hex encoded: %.*s\n", result, hex_result);

    // Null-terminate the hex string for decoding
    hex_result[result] = '\0';

    // Decode back
    uint8_t decoded[64];
    result = primitives_hex_to_bytes((const char*)hex_result, decoded, 64);
    if (result < 0) {
        printf("Error: Failed to decode hex: %d\n", result);
        return 1;
    }
    printf("Decoded: %.*s\n\n", result, decoded);

    // ========================================================================
    // U256 operations
    // ========================================================================
    printf("--- U256 Operations ---\n");

    PrimitivesU256 value;
    const char* value_hex = "0x1234567890abcdef";

    result = primitives_u256_from_hex(value_hex, &value);
    if (result != PRIMITIVES_SUCCESS) {
        printf("Error: Failed to parse u256: %d\n", result);
        return 1;
    }

    print_bytes("U256 bytes", value.bytes, 32);

    char u256_hex[128];
    result = primitives_u256_to_hex(&value, (uint8_t*)u256_hex, 128);
    if (result != PRIMITIVES_SUCCESS) {
        printf("Error: Failed to convert u256 to hex: %d\n", result);
        return 1;
    }
    printf("U256 hex: %.*s\n\n", 66, u256_hex);

    // ========================================================================
    // CREATE address calculation
    // ========================================================================
    printf("--- CREATE Address Calculation ---\n");

    PrimitivesAddress sender;
    primitives_address_from_hex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", &sender);

    PrimitivesAddress contract_addr;
    result = primitives_calculate_create_address(&sender, 0, &contract_addr);
    if (result != PRIMITIVES_SUCCESS) {
        printf("Error: Failed to calculate CREATE address: %d\n", result);
        return 1;
    }

    char contract_hex[42];
    primitives_address_to_hex(&contract_addr, (uint8_t*)contract_hex);
    printf("Contract address (nonce=0): %.*s\n", 42, contract_hex);

    printf("\n=== All tests passed! ===\n");
    return 0;
}
