import { BN254, type BN254G1PointType, type BN254G2PointType } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

/**
 * Shape interface for BN254 (alt_bn128) elliptic curve operations.
 * @since 0.0.1
 */
export interface Bn254ServiceShape {
  /**
   * Adds two G1 points.
   * @param a - First G1 point
   * @param b - Second G1 point
   * @returns Effect containing the sum point
   */
  readonly g1Add: (a: BN254G1PointType, b: BN254G1PointType) => Effect.Effect<BN254G1PointType>

  /**
   * Multiplies a G1 point by a scalar.
   * @param point - The G1 point
   * @param scalar - The scalar multiplier
   * @returns Effect containing the product point
   */
  readonly g1Mul: (point: BN254G1PointType, scalar: bigint) => Effect.Effect<BN254G1PointType>

  /**
   * Returns the G1 generator point.
   * @returns Effect containing the generator
   */
  readonly g1Generator: () => Effect.Effect<BN254G1PointType>

  /**
   * Adds two G2 points.
   * @param a - First G2 point
   * @param b - Second G2 point
   * @returns Effect containing the sum point
   */
  readonly g2Add: (a: BN254G2PointType, b: BN254G2PointType) => Effect.Effect<BN254G2PointType>

  /**
   * Multiplies a G2 point by a scalar.
   * @param point - The G2 point
   * @param scalar - The scalar multiplier
   * @returns Effect containing the product point
   */
  readonly g2Mul: (point: BN254G2PointType, scalar: bigint) => Effect.Effect<BN254G2PointType>

  /**
   * Returns the G2 generator point.
   * @returns Effect containing the generator
   */
  readonly g2Generator: () => Effect.Effect<BN254G2PointType>

  /**
   * Performs a pairing check on pairs of G1 and G2 points.
   * @param pairs - Array of [G1, G2] point pairs
   * @returns Effect containing true if pairing check passes
   */
  readonly pairingCheck: (pairs: ReadonlyArray<readonly [BN254G1PointType, BN254G2PointType]>) => Effect.Effect<boolean>
}

/**
 * BN254 (alt_bn128) elliptic curve service for Effect-based applications.
 * Used for zkSNARK verification and EVM precompiles.
 *
 * @example
 * ```typescript
 * import { Bn254Service, Bn254Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const bn254 = yield* Bn254Service
 *   const g1 = yield* bn254.g1Generator()
 *   const result = yield* bn254.g1Mul(g1, 2n)
 *   return result
 * }).pipe(Effect.provide(Bn254Live))
 * ```
 * @since 0.0.1
 */
export class Bn254Service extends Context.Tag("Bn254Service")<
  Bn254Service,
  Bn254ServiceShape
>() {}

/**
 * Production layer for Bn254Service using native BN254 implementation.
 * @since 0.0.1
 */
export const Bn254Live = Layer.succeed(Bn254Service, {
  g1Add: (a, b) => Effect.sync(() => BN254.G1.add(a, b)),
  g1Mul: (point, scalar) => Effect.sync(() => BN254.G1.mul(point, scalar)),
  g1Generator: () => Effect.sync(() => BN254.G1.generator()),
  g2Add: (a, b) => Effect.sync(() => BN254.G2.add(a, b)),
  g2Mul: (point, scalar) => Effect.sync(() => BN254.G2.mul(point, scalar)),
  g2Generator: () => Effect.sync(() => BN254.G2.generator()),
  pairingCheck: (pairs) => Effect.sync(() => BN254.Pairing.pairingCheck(pairs as Array<[BN254G1PointType, BN254G2PointType]>))
})

const mockG1Point: BN254G1PointType = { x: 1n, y: 2n, z: 1n } as BN254G1PointType
const mockG2Point: BN254G2PointType = { x: { c0: 1n, c1: 0n }, y: { c0: 1n, c1: 0n }, z: { c0: 1n, c1: 0n } } as BN254G2PointType

/**
 * Test layer for Bn254Service returning deterministic mock values.
 * Use for unit testing without cryptographic overhead.
 * @since 0.0.1
 */
export const Bn254Test = Layer.succeed(Bn254Service, {
  g1Add: (_a, _b) => Effect.succeed(mockG1Point),
  g1Mul: (_point, _scalar) => Effect.succeed(mockG1Point),
  g1Generator: () => Effect.succeed(mockG1Point),
  g2Add: (_a, _b) => Effect.succeed(mockG2Point),
  g2Mul: (_point, _scalar) => Effect.succeed(mockG2Point),
  g2Generator: () => Effect.succeed(mockG2Point),
  pairingCheck: (_pairs) => Effect.succeed(true)
})
