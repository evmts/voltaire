import type { BN254G1PointType, BN254G2PointType } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import { Bn254Service } from './Bn254Service.js'

/**
 * Adds two G1 points on the BN254 curve.
 *
 * @param a - First G1 point
 * @param b - Second G1 point
 * @returns Effect containing the sum point, requiring Bn254Service
 * @since 0.0.1
 */
export const g1Add = (a: BN254G1PointType, b: BN254G1PointType): Effect.Effect<BN254G1PointType, never, Bn254Service> =>
  Effect.gen(function* () {
    const bn254 = yield* Bn254Service
    return yield* bn254.g1Add(a, b)
  })

/**
 * Multiplies a G1 point by a scalar on the BN254 curve.
 *
 * @param point - The G1 point
 * @param scalar - The scalar multiplier
 * @returns Effect containing the product point, requiring Bn254Service
 * @since 0.0.1
 */
export const g1Mul = (point: BN254G1PointType, scalar: bigint): Effect.Effect<BN254G1PointType, never, Bn254Service> =>
  Effect.gen(function* () {
    const bn254 = yield* Bn254Service
    return yield* bn254.g1Mul(point, scalar)
  })

/**
 * Returns the G1 generator point for BN254.
 *
 * @returns Effect containing the generator point, requiring Bn254Service
 * @since 0.0.1
 */
export const g1Generator = (): Effect.Effect<BN254G1PointType, never, Bn254Service> =>
  Effect.gen(function* () {
    const bn254 = yield* Bn254Service
    return yield* bn254.g1Generator()
  })

/**
 * Adds two G2 points on the BN254 curve.
 *
 * @param a - First G2 point
 * @param b - Second G2 point
 * @returns Effect containing the sum point, requiring Bn254Service
 * @since 0.0.1
 */
export const g2Add = (a: BN254G2PointType, b: BN254G2PointType): Effect.Effect<BN254G2PointType, never, Bn254Service> =>
  Effect.gen(function* () {
    const bn254 = yield* Bn254Service
    return yield* bn254.g2Add(a, b)
  })

/**
 * Multiplies a G2 point by a scalar on the BN254 curve.
 *
 * @param point - The G2 point
 * @param scalar - The scalar multiplier
 * @returns Effect containing the product point, requiring Bn254Service
 * @since 0.0.1
 */
export const g2Mul = (point: BN254G2PointType, scalar: bigint): Effect.Effect<BN254G2PointType, never, Bn254Service> =>
  Effect.gen(function* () {
    const bn254 = yield* Bn254Service
    return yield* bn254.g2Mul(point, scalar)
  })

/**
 * Returns the G2 generator point for BN254.
 *
 * @returns Effect containing the generator point, requiring Bn254Service
 * @since 0.0.1
 */
export const g2Generator = (): Effect.Effect<BN254G2PointType, never, Bn254Service> =>
  Effect.gen(function* () {
    const bn254 = yield* Bn254Service
    return yield* bn254.g2Generator()
  })

/**
 * Performs a pairing check on pairs of G1 and G2 points.
 * Used for zkSNARK verification.
 *
 * @param pairs - Array of [G1, G2] point pairs
 * @returns Effect containing true if pairing check passes, requiring Bn254Service
 * @since 0.0.1
 */
export const pairingCheck = (pairs: ReadonlyArray<readonly [BN254G1PointType, BN254G2PointType]>): Effect.Effect<boolean, never, Bn254Service> =>
  Effect.gen(function* () {
    const bn254 = yield* Bn254Service
    return yield* bn254.pairingCheck(pairs)
  })
