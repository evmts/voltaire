/**
 * BN254 Curve Constants
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 */

/**
 * Field modulus (Fp)
 *
 * @since 0.0.0
 * @type {bigint}
 */
export const FP_MOD =
	21888242871839275222246405745257275088696311157297823662689037894645226208583n;

/**
 * Scalar field modulus (Fr) - curve order
 *
 * @since 0.0.0
 * @type {bigint}
 */
export const FR_MOD =
	21888242871839275222246405745257275088548364400416034343698204186575808495617n;

/**
 * Curve parameter b for G1: y^2 = x^3 + 3
 *
 * @since 0.0.0
 * @type {bigint}
 */
export const B_G1 = 3n;

/**
 * Curve parameter b for G2: y^2 = x^3 + 3/(9+u) in Fp2 (c0 component)
 *
 * @since 0.0.0
 * @type {bigint}
 */
export const B_G2_C0 =
	19485874751759354771024239261021720505790618469301721065564631296452457478373n;

/**
 * Curve parameter b for G2: y^2 = x^3 + 3/(9+u) in Fp2 (c1 component)
 *
 * @since 0.0.0
 * @type {bigint}
 */
export const B_G2_C1 =
	266929791119991161246907387137283842545076965332900288569378510910307636690n;

/**
 * G1 generator point X coordinate
 *
 * @since 0.0.0
 * @type {bigint}
 */
export const G1_GENERATOR_X = 1n;

/**
 * G1 generator point Y coordinate
 *
 * @since 0.0.0
 * @type {bigint}
 */
export const G1_GENERATOR_Y = 2n;

/**
 * G2 generator point X coordinate (Fp2 c0 component)
 *
 * @since 0.0.0
 * @type {bigint}
 */
export const G2_GENERATOR_X_C0 =
	10857046999023057135944570762232829481370756359578518086990519993285655852781n;

/**
 * G2 generator point X coordinate (Fp2 c1 component)
 *
 * @since 0.0.0
 * @type {bigint}
 */
export const G2_GENERATOR_X_C1 =
	11559732032986387107991004021392285783925812861821192530917403151452391805634n;

/**
 * G2 generator point Y coordinate (Fp2 c0 component)
 *
 * @since 0.0.0
 * @type {bigint}
 */
export const G2_GENERATOR_Y_C0 =
	8495653923123431417604973247489272438418190587263600148770280649306958101930n;

/**
 * G2 generator point Y coordinate (Fp2 c1 component)
 *
 * @since 0.0.0
 * @type {bigint}
 */
export const G2_GENERATOR_Y_C1 =
	4082367875863433681332203403145435568316851327593401208105741076214120093531n;

/**
 * Curve parameter t for BN254
 *
 * @since 0.0.0
 * @type {bigint}
 */
export const CURVE_PARAM_T = 4965661367192848881n;
