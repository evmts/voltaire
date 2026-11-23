/**
 * EVM Precompile implementations
 */
import type { HardforkType } from "../../primitives/Hardfork/HardforkType.js";
export { P256VERIFY_ADDRESS, P256VERIFY_GAS, P256VERIFY_INPUT_LENGTH, p256Verify, p256verify, verifyP256, } from "./p256verify.js";
/**
 * Precompile addresses. BLS12-381 entries follow the final EIP-2537 layout:
 * seven operations at `0x0b..0x11`.
 */
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
    BLS12_G1_MSM = "0x000000000000000000000000000000000000000c",
    BLS12_G2_ADD = "0x000000000000000000000000000000000000000d",
    BLS12_G2_MSM = "0x000000000000000000000000000000000000000e",
    BLS12_PAIRING = "0x000000000000000000000000000000000000000f",
    BLS12_MAP_FP_TO_G1 = "0x0000000000000000000000000000000000000010",
    BLS12_MAP_FP2_TO_G2 = "0x0000000000000000000000000000000000000011",
    P256_VERIFY = "0x0000000000000000000000000000000000000100"
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
 *
 * The address must be an active precompile for `hardfork`. An address that is
 * not (unknown, or not yet activated) is an ordinary account: nothing runs,
 * and the result is `success: false` with `gasUsed: 0n`.
 *
 * @param address - Precompile address
 * @param input - Input data
 * @param gasLimit - Gas limit for execution
 * @param hardfork - Current hardfork
 * @returns Precompile execution result
 */
export declare function execute(address: string, input: Uint8Array, gasLimit: bigint, hardfork: HardforkType): PrecompileResult;
/**
 * ECRECOVER precompile (0x01)
 * Recover signer address from signature
 *
 * Input (right-padded or truncated to 128 bytes): `hash(32) || v(32) || r(32) || s(32)`.
 * `v` is a full 32-byte word: bytes 32..62 must be zero and byte 63 must be
 * 27 or 28. `r` and `s` must be in `[1, n - 1]`; high `s` is accepted.
 * Any invalid input or failed recovery succeeds with empty output and costs
 * 3000 gas. A successful recovery returns the address left-padded to 32 bytes.
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
 * Right-pads missing input bytes and returns a modulus-sized result.
 * Osaka rejects declared operands above 1,024 bytes before empty-output
 * shortcuts and uses EIP-7883 gas. Exceptional failures consume all supplied gas.
 * @param _input - EIP-198 length header followed by operand bytes
 * @param gasLimit - Gas forwarded to the precompile
 * @param hardfork - Active fork; defaults to Berlin pricing
 * @returns Execution status, owned output bytes and consumed gas
 */
export declare function modexp(_input: Uint8Array, gasLimit: bigint, hardfork?: HardforkType): PrecompileResult;
/**
 * BN254_ADD precompile (0x06)
 * BN254 elliptic curve addition
 *
 * Gas: 500 from Byzantium (EIP-196), 150 from Istanbul (EIP-1108).
 * @param _input - Two G1 points, right-padded or truncated to 128 bytes
 * @param gasLimit - Gas forwarded to the precompile
 * @param hardfork - Active fork; defaults to the latest stable fork
 */
export declare function bn254Add(_input: Uint8Array, gasLimit: bigint, hardfork?: HardforkType): PrecompileResult;
/**
 * BN254_MUL precompile (0x07)
 * BN254 elliptic curve multiplication
 *
 * Gas: 40000 from Byzantium (EIP-196), 6000 from Istanbul (EIP-1108).
 * @param _input - G1 point and scalar, right-padded or truncated to 96 bytes
 * @param gasLimit - Gas forwarded to the precompile
 * @param hardfork - Active fork; defaults to the latest stable fork
 */
export declare function bn254Mul(_input: Uint8Array, gasLimit: bigint, hardfork?: HardforkType): PrecompileResult;
/**
 * BN254_PAIRING precompile (0x08)
 * BN254 pairing check
 *
 * Gas for k pairs: `100000 + 80000 * k` from Byzantium (EIP-197),
 * `45000 + 34000 * k` from Istanbul (EIP-1108).
 * Halts on a coordinate >= the field modulus, an off-curve point, or a G2
 * point outside the order-r subgroup.
 * @param input - k pairs of 192 bytes (G1 `x || y`, then G2
 *   `x_imag || x_real || y_imag || y_real`)
 * @param gasLimit - Gas forwarded to the precompile
 * @param hardfork - Active fork; defaults to the latest stable fork
 */
export declare function bn254Pairing(input: Uint8Array, gasLimit: bigint, hardfork?: HardforkType): PrecompileResult;
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
 * - versioned_hash (32 bytes) - `0x01 || sha256(commitment)[1..32]`
 * - z (32 bytes) - evaluation point
 * - y (32 bytes) - claimed evaluation result
 * - commitment (48 bytes) - KZG commitment
 * - proof (48 bytes) - KZG proof
 *
 * Returns `FIELD_ELEMENTS_PER_BLOB || BLS_MODULUS` (64 bytes) when the
 * versioned hash matches the commitment and the proof verifies. A wrong input
 * length, a mismatched versioned hash, a non-canonical field element, or an
 * invalid proof is an exceptional halt that consumes all forwarded gas.
 */
export declare function pointEvaluation(_input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLS12_G1ADD precompile (0x0b, EIP-2537)
 *
 * Input: two G1 points (256 bytes). Output: one G1 point (128 bytes).
 * Gas: 375. Points must be on the curve; no subgroup check.
 */
export declare function bls12G1Add(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLS12_G1MSM precompile (0x0c, EIP-2537)
 *
 * Input: k >= 1 pairs of G1 point (128 bytes) and scalar (32 bytes).
 * Output: one G1 point (128 bytes).
 * Gas: `k * 12000 * discount(k) / 1000`. Every point must be in the subgroup.
 */
export declare function bls12G1Msm(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLS12_G2ADD precompile (0x0d, EIP-2537)
 *
 * Input: two G2 points (512 bytes). Output: one G2 point (256 bytes).
 * Gas: 600. Points must be on the curve; no subgroup check.
 */
export declare function bls12G2Add(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLS12_G2MSM precompile (0x0e, EIP-2537)
 *
 * Input: k >= 1 pairs of G2 point (256 bytes) and scalar (32 bytes).
 * Output: one G2 point (256 bytes).
 * Gas: `k * 22500 * discount(k) / 1000`. Every point must be in the subgroup.
 */
export declare function bls12G2Msm(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLS12_PAIRING_CHECK precompile (0x0f, EIP-2537)
 *
 * Input: k >= 1 pairs of G1 point (128 bytes) and G2 point (256 bytes).
 * Output: 32 bytes, last byte 1 when the product of pairings is one, else 0.
 * Gas: `32600 * k + 37700`. Every point must be in its subgroup.
 */
export declare function bls12Pairing(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLS12_MAP_FP_TO_G1 precompile (0x10, EIP-2537)
 *
 * Input: one canonical Fp element (64 bytes). Output: one G1 point (128 bytes).
 * Gas: 5500. Applies the field-to-curve map directly; the input is not hashed.
 */
export declare function bls12MapFpToG1(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/**
 * BLS12_MAP_FP2_TO_G2 precompile (0x11, EIP-2537)
 *
 * Input: one canonical Fp2 element `c0 || c1` (128 bytes).
 * Output: one G2 point (256 bytes).
 * Gas: 23800. Applies the field-to-curve map directly; the input is not hashed.
 */
export declare function bls12MapFp2ToG2(input: Uint8Array, gasLimit: bigint): PrecompileResult;
//# sourceMappingURL=precompiles.d.ts.map