/**
 * @fileoverview Standalone BN254 curve operations for Effect-based applications.
 * @module Bn254/operations
 * @since 0.0.1
 */

import type { BN254G1PointType, BN254G2PointType } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import { Bn254Service } from './Bn254Service.js'

/**
 * Adds two G1 points on the BN254 curve.
 *
 * @description
 * Performs elliptic curve point addition on the G1 group of BN254.
 * This corresponds to EVM precompile at address 0x06 (ecAdd).
 *
 * @param a - First G1 point
 * @param b - Second G1 point
 * @returns Effect containing the sum point, requiring Bn254Service
 *
 * @example
 * ```typescript
 * import { g1Add, g1Generator, Bn254Live } from 'voltaire-effect/crypto/Bn254'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const g = yield* g1Generator()
 *   const sum = yield* g1Add(g, g) // 2G
 *   return sum
 * }).pipe(Effect.provide(Bn254Live))
 * ```
 *
 * @throws Never - This operation is infallible for valid points
 * @see {@link g1Mul} - Scalar multiplication
 * @see {@link Bn254Service} - Full service interface
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
 * @description
 * Performs scalar multiplication on the G1 group of BN254.
 * This corresponds to EVM precompile at address 0x07 (ecMul).
 *
 * @param point - The G1 point
 * @param scalar - The scalar multiplier (bigint)
 * @returns Effect containing the product point, requiring Bn254Service
 *
 * @example
 * ```typescript
 * import { g1Mul, g1Generator, Bn254Live } from 'voltaire-effect/crypto/Bn254'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const g = yield* g1Generator()
 *   const point42 = yield* g1Mul(g, 42n)
 *   return point42
 * }).pipe(Effect.provide(Bn254Live))
 * ```
 *
 * @throws Never - This operation is infallible for valid inputs
 * @see {@link g1Add} - Point addition
 * @see {@link Bn254Service} - Full service interface
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
 * @description
 * Returns the standard generator point for the G1 group of BN254.
 * All other G1 points can be derived from this via scalar multiplication.
 *
 * @returns Effect containing the G1 generator point, requiring Bn254Service
 *
 * @example
 * ```typescript
 * import { g1Generator, Bn254Live } from 'voltaire-effect/crypto/Bn254'
 * import * as Effect from 'effect/Effect'
 *
 * const g = await Effect.runPromise(
 *   g1Generator().pipe(Effect.provide(Bn254Live))
 * )
 * ```
 *
 * @throws Never - This operation is infallible
 * @see {@link g1Mul} - Use generator with scalar multiplication
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
 * @description
 * Performs elliptic curve point addition on the G2 extension field group.
 *
 * @param a - First G2 point
 * @param b - Second G2 point
 * @returns Effect containing the sum point, requiring Bn254Service
 *
 * @example
 * ```typescript
 * import { g2Add, g2Generator, Bn254Live } from 'voltaire-effect/crypto/Bn254'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const g = yield* g2Generator()
 *   const sum = yield* g2Add(g, g)
 *   return sum
 * }).pipe(Effect.provide(Bn254Live))
 * ```
 *
 * @throws Never - This operation is infallible for valid points
 * @see {@link g2Mul} - Scalar multiplication on G2
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
 * @description
 * Performs scalar multiplication on the G2 extension field group.
 *
 * @param point - The G2 point
 * @param scalar - The scalar multiplier (bigint)
 * @returns Effect containing the product point, requiring Bn254Service
 *
 * @example
 * ```typescript
 * import { g2Mul, g2Generator, Bn254Live } from 'voltaire-effect/crypto/Bn254'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const g = yield* g2Generator()
 *   const point42 = yield* g2Mul(g, 42n)
 *   return point42
 * }).pipe(Effect.provide(Bn254Live))
 * ```
 *
 * @throws Never - This operation is infallible for valid inputs
 * @see {@link g2Add} - Point addition on G2
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
 * @description
 * Returns the standard generator point for the G2 group of BN254.
 *
 * @returns Effect containing the G2 generator point, requiring Bn254Service
 *
 * @example
 * ```typescript
 * import { g2Generator, Bn254Live } from 'voltaire-effect/crypto/Bn254'
 * import * as Effect from 'effect/Effect'
 *
 * const g = await Effect.runPromise(
 *   g2Generator().pipe(Effect.provide(Bn254Live))
 * )
 * ```
 *
 * @throws Never - This operation is infallible
 * @see {@link g2Mul} - Use generator with scalar multiplication
 * @since 0.0.1
 */
export const g2Generator = (): Effect.Effect<BN254G2PointType, never, Bn254Service> =>
  Effect.gen(function* () {
    const bn254 = yield* Bn254Service
    return yield* bn254.g2Generator()
  })

/**
 * Performs a pairing check on pairs of G1 and G2 points.
 *
 * @description
 * Verifies that the product of pairings equals the identity element:
 * e(A1, B1) * e(A2, B2) * ... = 1
 *
 * This is the core operation for zkSNARK verification and corresponds
 * to EVM precompile at address 0x08 (ecPairing).
 *
 * @param pairs - Array of [G1, G2] point pairs
 * @returns Effect containing true if pairing check passes, requiring Bn254Service
 *
 * @example
 * ```typescript
 * import { pairingCheck, g1Generator, g2Generator, Bn254Live } from 'voltaire-effect/crypto/Bn254'
 * import * as Effect from 'effect/Effect'
 *
 * // Verify a zkSNARK proof
 * const verifyProof = Effect.gen(function* () {
 *   const g1 = yield* g1Generator()
 *   const g2 = yield* g2Generator()
 *
 *   // Construct pairing pairs from proof elements
 *   const pairs = [[g1, g2], [proofA, proofB]] as const
 *
 *   const isValid = yield* pairingCheck(pairs)
 *   return isValid
 * }).pipe(Effect.provide(Bn254Live))
 * ```
 *
 * @throws Never - This operation is infallible for valid points
 * @see {@link g1Generator}, {@link g2Generator} - Get generator points
 * @see {@link Bn254Service} - Full service interface
 * @since 0.0.1
 */
export const pairingCheck = (pairs: ReadonlyArray<readonly [BN254G1PointType, BN254G2PointType]>): Effect.Effect<boolean, never, Bn254Service> =>
  Effect.gen(function* () {
    const bn254 = yield* Bn254Service
    return yield* bn254.pairingCheck(pairs)
  })
