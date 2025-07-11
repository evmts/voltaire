/**
 * BN254 Wrapper Library - C Header
 * 
 * C-compatible API for BN254 elliptic curve operations
 * Designed for integration with Zig code for Ethereum precompiles
 */

#ifndef BN254_WRAPPER_H
#define BN254_WRAPPER_H

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Result codes for BN254 operations
 */
typedef enum {
    BN254_SUCCESS = 0,
    BN254_INVALID_INPUT = 1,
    BN254_INVALID_POINT = 2,
    BN254_INVALID_SCALAR = 3,
    BN254_COMPUTATION_FAILED = 4,
} Bn254Result;

/**
 * Initialize the BN254 library
 * This function can be called multiple times safely
 * 
 * @return BN254_SUCCESS on success
 */
int bn254_init(void);

/**
 * Perform elliptic curve scalar multiplication (ECMUL)
 * 
 * Input format (96 bytes):
 * - Bytes 0-31: x coordinate (big-endian)
 * - Bytes 32-63: y coordinate (big-endian)  
 * - Bytes 64-95: scalar (big-endian)
 *
 * Output format (64 bytes):
 * - Bytes 0-31: result x coordinate (big-endian)
 * - Bytes 32-63: result y coordinate (big-endian)
 *
 * @param input Input data pointer
 * @param input_len Length of input data (must be >= 96)
 * @param output Output buffer pointer
 * @param output_len Length of output buffer (must be >= 64)
 * @return BN254_SUCCESS on success, error code otherwise
 */
int bn254_ecmul(
    const unsigned char* input,
    unsigned int input_len,
    unsigned char* output,
    unsigned int output_len
);

/**
 * Perform elliptic curve pairing check (ECPAIRING)
 * 
 * Input format (multiple of 192 bytes):
 * Each 192-byte group contains:
 * - Bytes 0-63: G1 point (x, y coordinates, 32 bytes each)
 * - Bytes 64-191: G2 point (x and y in Fp2, 64 bytes each)
 *
 * Output format (32 bytes):
 * - 32-byte boolean result (0x00...00 for false, 0x00...01 for true)
 *
 * @param input Input data pointer
 * @param input_len Length of input data (must be multiple of 192)
 * @param output Output buffer pointer  
 * @param output_len Length of output buffer (must be >= 32)
 * @return BN254_SUCCESS on success, error code otherwise
 */
int bn254_ecpairing(
    const unsigned char* input,
    unsigned int input_len,
    unsigned char* output,
    unsigned int output_len
);

/**
 * Get the expected output size for ECMUL
 * @return 64 bytes
 */
unsigned int bn254_ecmul_output_size(void);

/**
 * Get the expected output size for ECPAIRING  
 * @return 32 bytes
 */
unsigned int bn254_ecpairing_output_size(void);

/**
 * Validate ECMUL input format
 * @param input Input data pointer
 * @param input_len Length of input data
 * @return BN254_SUCCESS if valid, error code otherwise
 */
int bn254_ecmul_validate_input(
    const unsigned char* input,
    unsigned int input_len
);

/**
 * Validate ECPAIRING input format
 * @param input Input data pointer
 * @param input_len Length of input data
 * @return BN254_SUCCESS if valid, error code otherwise
 */
int bn254_ecpairing_validate_input(
    const unsigned char* input,
    unsigned int input_len
);

#ifdef __cplusplus
}
#endif

#endif /* BN254_WRAPPER_H */