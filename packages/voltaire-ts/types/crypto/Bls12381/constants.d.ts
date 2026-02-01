/**
 * BLS12-381 Constants
 *
 * Curve parameters for BLS12-381 pairing-friendly elliptic curve.
 * Used for Ethereum consensus layer (Beacon Chain) validator signatures.
 *
 * @see https://hackmd.io/@benjaminion/bls12-381 for curve details
 * @see https://eips.ethereum.org/EIPS/eip-2537 for precompile specs
 * @since 0.0.0
 */
/**
 * Base field modulus p (381 bits)
 * p = 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab
 * @type {bigint}
 */
export const FP_MOD: bigint;
/**
 * Scalar field modulus r (curve order, 255 bits)
 * r = 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001
 * @type {bigint}
 */
export const FR_MOD: bigint;
/**
 * G1 curve coefficient b = 4
 * y^2 = x^3 + 4 over Fp
 * @type {bigint}
 */
export const B_G1: bigint;
/**
 * G2 curve coefficient b = 4(1+i)
 * y^2 = x^3 + 4(1+i) over Fp2
 * Represented as [4, 4] for the Fp2 element
 * @type {{c0: bigint, c1: bigint}}
 */
export const B_G2: {
    c0: bigint;
    c1: bigint;
};
/**
 * G1 generator x-coordinate
 * @type {bigint}
 */
export const G1_GENERATOR_X: bigint;
/**
 * G1 generator y-coordinate
 * @type {bigint}
 */
export const G1_GENERATOR_Y: bigint;
/**
 * G2 generator x-coordinate (Fp2 element)
 * @type {{c0: bigint, c1: bigint}}
 */
export const G2_GENERATOR_X: {
    c0: bigint;
    c1: bigint;
};
/**
 * G2 generator y-coordinate (Fp2 element)
 * @type {{c0: bigint, c1: bigint}}
 */
export const G2_GENERATOR_Y: {
    c0: bigint;
    c1: bigint;
};
/**
 * G2 cofactor h2 (large value)
 * @type {bigint}
 */
export const G2_COFACTOR: bigint;
/**
 * Embedding degree k = 12
 * @type {number}
 */
export const EMBEDDING_DEGREE: number;
/**
 * BLS parameter x (used in Miller loop)
 * x = -0xd201000000010000 (negative)
 * @type {bigint}
 */
export const BLS_X: bigint;
/**
 * BLS parameter x is negative
 * @type {boolean}
 */
export const BLS_X_IS_NEGATIVE: boolean;
//# sourceMappingURL=constants.d.ts.map