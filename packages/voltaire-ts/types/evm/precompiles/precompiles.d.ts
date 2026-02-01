/**
 * EVM Precompile implementations
 */
import type { HardforkType } from "../../primitives/Hardfork/HardforkType.js";
export declare enum PrecompileAddress {
    ECRECOVER = "0x0000000000000000000000000000000000000001",
    SHA256 = "0x0000000000000000000000000000000000000002",
    RIPEMD160 = "0x0000000000000000000000000000000000000003",
    IDENTITY = "0x0000000000000000000000000000000000000004",
    MODEXP = "0x0000000000000000000000000000000000000005",
    BN254_ADD = "0x0000000000000000000000000000000000000006",
    BN254_MUL = "0x0000000000000000000000000000000000000007",
    BN254_PAIRING = "0x0000000000000000000000000000000000000008",
    BLAKE2F = "0x0000000000000000000000000000000000000009",
    POINT_EVALUATION = "0x000000000000000000000000000000000000000a",
    BLS12_G1_ADD = "0x000000000000000000000000000000000000000b",
    BLS12_G1_MUL = "0x000000000000000000000000000000000000000c",
    BLS12_G1_MSM = "0x000000000000000000000000000000000000000d",
    BLS12_G2_ADD = "0x000000000000000000000000000000000000000e",
    BLS12_G2_MUL = "0x000000000000000000000000000000000000000f",
    BLS12_G2_MSM = "0x0000000000000000000000000000000000000010",
    BLS12_PAIRING = "0x0000000000000000000000000000000000000011",
    BLS12_MAP_FP_TO_G1 = "0x0000000000000000000000000000000000000012",
    BLS12_MAP_FP2_TO_G2 = "0x0000000000000000000000000000000000000013"
}
export interface PrecompileResult {
    success: boolean;
    output: Uint8Array;
    gasUsed: bigint;
    error?: string;
}
/**
 * Check if an address is a precompile for a given hardfork
 */
export declare function isPrecompile(address: string, hardfork: HardforkType): boolean;
/**
 * Execute a precompile
 * @param address - Precompile address
 * @param input - Input data
 * @param gasLimit - Gas limit for execution
 * @param hardfork - Current hardfork
 * @returns Precompile execution result
 */
export declare function execute(address: string, input: Uint8Array, gasLimit: bigint, _hardfork: HardforkType): PrecompileResult;
/**
 * ECRECOVER precompile (0x01)
 * Recover signer address from signature
 */
export declare function ecrecover(_input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * SHA256 precompile (0x02)
 */
export declare function sha256(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * RIPEMD160 precompile (0x03)
 */
export declare function ripemd160(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * IDENTITY precompile (0x04)
 * Returns input data unchanged
 */
export declare function identity(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * MODEXP precompile (0x05)
 * Modular exponentiation
 */
export declare function modexp(_input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BN254_ADD precompile (0x06)
 * BN254 elliptic curve addition
 */
export declare function bn254Add(_input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BN254_MUL precompile (0x07)
 * BN254 elliptic curve multiplication
 */
export declare function bn254Mul(_input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BN254_PAIRING precompile (0x08)
 * BN254 pairing check
 */
export declare function bn254Pairing(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLAKE2F precompile (0x09)
 * Blake2 F compression function per EIP-152
 *
 * Input format (213 bytes):
 * - rounds (4 bytes, big-endian) - number of compression rounds
 * - h (64 bytes) - state vector
 * - m (128 bytes) - message block
 * - t (16 bytes) - offset counters
 * - f (1 byte) - final block flag (must be 0 or 1)
 *
 * @see https://eips.ethereum.org/EIPS/eip-152
 */
export declare function blake2f(_input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * POINT_EVALUATION precompile (0x0a)
 * KZG point evaluation (EIP-4844)
 *
 * Input format (192 bytes per EIP-4844):
 * - versioned_hash (32 bytes) - hash of the blob commitment
 * - z (32 bytes) - evaluation point
 * - y (32 bytes) - claimed evaluation result
 * - commitment (48 bytes) - KZG commitment
 * - proof (48 bytes) - KZG proof
 */
export declare function pointEvaluation(_input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLS12_G1_ADD precompile (0x0b)
 */
export declare function bls12G1Add(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLS12_G1_MUL precompile (0x0c)
 */
export declare function bls12G1Mul(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLS12_G1_MSM precompile (0x0d)
 */
export declare function bls12G1Msm(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLS12_G2_ADD precompile (0x0e)
 */
export declare function bls12G2Add(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLS12_G2_MUL precompile (0x0f)
 */
export declare function bls12G2Mul(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLS12_G2_MSM precompile (0x10)
 */
export declare function bls12G2Msm(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLS12_PAIRING precompile (0x11)
 */
export declare function bls12Pairing(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLS12_MAP_FP_TO_G1 precompile (0x12)
 */
export declare function bls12MapFpToG1(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLS12_MAP_FP2_TO_G2 precompile (0x13)
 */
export declare function bls12MapFp2ToG2(input: Uint8Array, gasLimit: bigint): PrecompileResult;
//# sourceMappingURL=precompiles.d.ts.map