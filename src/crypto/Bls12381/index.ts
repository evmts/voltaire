/**
 * BLS12-381 Elliptic Curve Cryptography
 *
 * Pairing-friendly curve for Ethereum consensus layer signatures.
 *
 * @example
 * ```typescript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const g1Point = Bls12381.G1.generator();
 * const g2Point = Bls12381.G2.generator();
 * ```
 */

export * from "./Bls12381.js";
export type { G1PointType } from "./G1PointType.js";
export type { G2PointType } from "./G2PointType.js";
export type { Fp2Type } from "./Fp2Type.js";
