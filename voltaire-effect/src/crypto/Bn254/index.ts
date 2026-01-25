/**
 * @fileoverview BN254 (alt_bn128) elliptic curve module for Effect.
 *
 * @description
 * Provides BN254 (alt_bn128) pairing-friendly elliptic curve operations
 * for zkSNARK verification and EVM precompile compatibility.
 *
 * EVM Precompiles:
 * - 0x06: ecAdd (G1 point addition)
 * - 0x07: ecMul (G1 scalar multiplication)
 * - 0x08: ecPairing (pairing check)
 *
 * Key features:
 * - zkSNARK proof verification
 * - Bilinear pairing operations
 * - G1 and G2 group arithmetic
 * - Used in zkRollups, Tornado Cash, etc.
 *
 * @example
 * ```typescript
 * import { g1Generator, g1Mul, pairingCheck, Bn254Live } from 'voltaire-effect/crypto/Bn254'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const g1 = yield* g1Generator()
 *   const point = yield* g1Mul(g1, 42n)
 *   return point
 * }).pipe(Effect.provide(Bn254Live))
 *
 * const result = await Effect.runPromise(program)
 * ```
 *
 * @module Bn254
 * @since 0.0.1
 */

export type { BN254G1PointType, BN254G2PointType } from "@tevm/voltaire";
export {
	Bn254Live,
	Bn254Service,
	type Bn254ServiceShape,
	Bn254Test,
} from "./Bn254Service.js";
export {
	g1Add,
	g1Generator,
	g1Mul,
	g2Add,
	g2Generator,
	g2Mul,
	pairingCheck,
} from "./operations.js";
