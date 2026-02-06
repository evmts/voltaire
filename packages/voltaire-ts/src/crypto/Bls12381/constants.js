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
export const FP_MOD =
	0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn;

/**
 * Scalar field modulus r (curve order, 255 bits)
 * r = 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001
 * @type {bigint}
 */
export const FR_MOD =
	0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001n;

/**
 * G1 curve coefficient b = 4
 * y^2 = x^3 + 4 over Fp
 * @type {bigint}
 */
export const B_G1 = 4n;

/**
 * G2 curve coefficient b = 4(1+i)
 * y^2 = x^3 + 4(1+i) over Fp2
 * Represented as [4, 4] for the Fp2 element
 * @type {{c0: bigint, c1: bigint}}
 */
export const B_G2 = { c0: 4n, c1: 4n };

/**
 * G1 generator x-coordinate
 * @type {bigint}
 */
export const G1_GENERATOR_X =
	0x17f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bbn;

/**
 * G1 generator y-coordinate
 * @type {bigint}
 */
export const G1_GENERATOR_Y =
	0x08b3f481e3aaa0f1a09e30ed741d8ae4fcf5e095d5d00af600db18cb2c04b3edd03cc744a2888ae40caa232946c5e7e1n;

/**
 * G2 generator x-coordinate (Fp2 element)
 * @type {{c0: bigint, c1: bigint}}
 */
export const G2_GENERATOR_X = {
	c0: 0x024aa2b2f08f0a91260805272dc51051c6e47ad4fa403b02b4510b647ae3d1770bac0326a805bbefd48056c8c121bdb8n,
	c1: 0x13e02b6052719f607dacd3a088274f65596bd0d09920b61ab5da61bbdc7f5049334cf11213945d57e5ac7d055d042b7en,
};

/**
 * G2 generator y-coordinate (Fp2 element)
 * @type {{c0: bigint, c1: bigint}}
 */
export const G2_GENERATOR_Y = {
	c0: 0x0ce5d527727d6e118cc9cdc6da2e351aadfd9baa8cbdd3a76d429a695160d12c923ac9cc3baca289e193548608b82801n,
	c1: 0x0606c4a02ea734cc32acd2b02bc28b99cb3e287e85a763af267492ab572e99ab3f370d275cec1da1aaa9075ff05f79ben,
};

/**
 * G2 cofactor h2 (large value)
 * @type {bigint}
 */
export const G2_COFACTOR =
	0x5d543a95414e7f1091d50792876a202cd91de4547085abaa68a205b2e5a7ddfa628f1cb4d9e82ef21537e293a6691ae1616ec6e786f0c70cf1c38e31c7238e5n;

/**
 * Embedding degree k = 12
 * @type {number}
 */
export const EMBEDDING_DEGREE = 12;

/**
 * BLS parameter x (used in Miller loop)
 * x = -0xd201000000010000 (negative)
 * @type {bigint}
 */
export const BLS_X = 0xd201000000010000n;

/**
 * BLS parameter x is negative
 * @type {boolean}
 */
export const BLS_X_IS_NEGATIVE = true;
