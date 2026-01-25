/**
 * @fileoverview BN254 (alt_bn128) elliptic curve service for Effect-based applications.
 * Provides pairing operations for zkSNARK verification and EVM precompiles.
 * @module Bn254Service
 * @since 0.0.1
 */

import {
	BN254,
	type BN254G1PointType,
	type BN254G2PointType,
} from "@tevm/voltaire";
import * as Context from "effect/Context";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

/**
 * Error thrown when a BN254 curve operation fails.
 *
 * @description
 * Contains the operation that failed, error message, and optional cause.
 *
 * Common failure reasons:
 * - Invalid point (not on curve)
 * - Invalid scalar value
 * - Pairing check input validation failure
 *
 * @since 0.0.1
 */
export class Bn254Error extends Data.TaggedError("Bn254Error")<{
	/** The BN254 operation that failed */
	readonly operation:
		| "g1Add"
		| "g1Mul"
		| "g1Generator"
		| "g2Add"
		| "g2Mul"
		| "g2Generator"
		| "pairingCheck";
	/** Human-readable error message */
	readonly message: string;
	/** Underlying error that caused this failure */
	readonly cause?: unknown;
}> {}

/**
 * Shape interface for BN254 (alt_bn128) elliptic curve operations.
 *
 * @description
 * Defines the contract for BN254 curve operations including G1/G2 point
 * arithmetic and pairing checks. BN254 is used in Ethereum for zkSNARK
 * verification via EVM precompiles.
 *
 * @see {@link Bn254Service} - The service using this shape
 * @since 0.0.1
 */
export interface Bn254ServiceShape {
	/**
	 * Adds two G1 points on the BN254 curve.
	 *
	 * @description
	 * Performs elliptic curve point addition on G1. This operation is
	 * available as EVM precompile at address 0x06.
	 *
	 * @param a - First G1 point
	 * @param b - Second G1 point
	 * @returns Effect containing the sum point, or Bn254Error if operation fails
	 */
	readonly g1Add: (
		a: BN254G1PointType,
		b: BN254G1PointType,
	) => Effect.Effect<BN254G1PointType, Bn254Error>;

	/**
	 * Multiplies a G1 point by a scalar.
	 *
	 * @description
	 * Performs scalar multiplication on G1. This operation is
	 * available as EVM precompile at address 0x07.
	 *
	 * @param point - The G1 point
	 * @param scalar - The scalar multiplier (bigint)
	 * @returns Effect containing the product point, or Bn254Error if operation fails
	 */
	readonly g1Mul: (
		point: BN254G1PointType,
		scalar: bigint,
	) => Effect.Effect<BN254G1PointType, Bn254Error>;

	/**
	 * Returns the G1 generator point for BN254.
	 *
	 * @description
	 * Returns the standard generator point for the G1 group.
	 *
	 * @returns Effect containing the G1 generator point, or Bn254Error if operation fails
	 */
	readonly g1Generator: () => Effect.Effect<BN254G1PointType, Bn254Error>;

	/**
	 * Adds two G2 points on the BN254 curve.
	 *
	 * @description
	 * Performs elliptic curve point addition on the G2 extension field.
	 *
	 * @param a - First G2 point
	 * @param b - Second G2 point
	 * @returns Effect containing the sum point, or Bn254Error if operation fails
	 */
	readonly g2Add: (
		a: BN254G2PointType,
		b: BN254G2PointType,
	) => Effect.Effect<BN254G2PointType, Bn254Error>;

	/**
	 * Multiplies a G2 point by a scalar.
	 *
	 * @description
	 * Performs scalar multiplication on the G2 extension field.
	 *
	 * @param point - The G2 point
	 * @param scalar - The scalar multiplier (bigint)
	 * @returns Effect containing the product point, or Bn254Error if operation fails
	 */
	readonly g2Mul: (
		point: BN254G2PointType,
		scalar: bigint,
	) => Effect.Effect<BN254G2PointType, Bn254Error>;

	/**
	 * Returns the G2 generator point for BN254.
	 *
	 * @description
	 * Returns the standard generator point for the G2 group.
	 *
	 * @returns Effect containing the G2 generator point, or Bn254Error if operation fails
	 */
	readonly g2Generator: () => Effect.Effect<BN254G2PointType, Bn254Error>;

	/**
	 * Performs a pairing check on pairs of G1 and G2 points.
	 *
	 * @description
	 * Verifies that the product of pairings equals the identity element.
	 * This is the core operation for zkSNARK verification. Available as
	 * EVM precompile at address 0x08.
	 *
	 * @param pairs - Array of [G1, G2] point pairs
	 * @returns Effect containing true if pairing check passes, or Bn254Error if operation fails
	 */
	readonly pairingCheck: (
		pairs: ReadonlyArray<readonly [BN254G1PointType, BN254G2PointType]>,
	) => Effect.Effect<boolean, Bn254Error>;
}

/**
 * BN254 (alt_bn128) elliptic curve service for Effect-based applications.
 *
 * @description
 * BN254 (also known as alt_bn128) is a pairing-friendly elliptic curve
 * used in Ethereum for zkSNARK verification. It provides efficient
 * bilinear pairings enabling zero-knowledge proofs.
 *
 * EVM Precompiles:
 * - 0x06: G1 point addition (ecAdd)
 * - 0x07: G1 scalar multiplication (ecMul)
 * - 0x08: Pairing check (ecPairing)
 *
 * Key features:
 * - zkSNARK proof verification
 * - EVM precompile compatibility
 * - Bilinear pairing operations
 * - Used in zkRollups, Tornado Cash, etc.
 *
 * @example
 * ```typescript
 * import { Bn254Service, Bn254Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * // G1 operations
 * const program = Effect.gen(function* () {
 *   const bn254 = yield* Bn254Service
 *
 *   // Get generator and perform scalar multiplication
 *   const g1 = yield* bn254.g1Generator()
 *   const point2x = yield* bn254.g1Mul(g1, 2n)
 *
 *   // Point addition
 *   const sum = yield* bn254.g1Add(g1, point2x)
 *
 *   return sum
 * }).pipe(Effect.provide(Bn254Live))
 *
 * const result = await Effect.runPromise(program)
 * ```
 *
 * @see {@link Bn254Live} - Production layer using native BN254
 * @see {@link Bn254Test} - Test layer with deterministic output
 * @see {@link g1Add}, {@link g1Mul}, {@link pairingCheck} - Standalone functions
 * @since 0.0.1
 */
export class Bn254Service extends Context.Tag("Bn254Service")<
	Bn254Service,
	Bn254ServiceShape
>() {}

/**
 * Production layer for Bn254Service using native BN254 implementation.
 *
 * @description
 * Provides the live implementation backed by the high-performance native
 * BN254 implementation from @tevm/voltaire. Use this layer in production
 * applications for real cryptographic operations.
 *
 * @example
 * ```typescript
 * import { Bn254Service, Bn254Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const bn254 = yield* Bn254Service
 *   const g1 = yield* bn254.g1Generator()
 *   return yield* bn254.g1Mul(g1, 42n)
 * }).pipe(Effect.provide(Bn254Live))
 * ```
 *
 * @see {@link Bn254Service} - The service definition
 * @see {@link Bn254Test} - Test layer for unit testing
 * @since 0.0.1
 */
export const Bn254Live = Layer.succeed(Bn254Service, {
	g1Add: (a, b) =>
		Effect.try({
			try: () => BN254.G1.add(a, b),
			catch: (e) =>
				new Bn254Error({
					operation: "g1Add",
					message: `G1 point addition failed: ${e}`,
					cause: e,
				}),
		}),
	g1Mul: (point, scalar) =>
		Effect.try({
			try: () => BN254.G1.mul(point, scalar),
			catch: (e) =>
				new Bn254Error({
					operation: "g1Mul",
					message: `G1 scalar multiplication failed: ${e}`,
					cause: e,
				}),
		}),
	g1Generator: () =>
		Effect.try({
			try: () => BN254.G1.generator(),
			catch: (e) =>
				new Bn254Error({
					operation: "g1Generator",
					message: `Failed to get G1 generator: ${e}`,
					cause: e,
				}),
		}),
	g2Add: (a, b) =>
		Effect.try({
			try: () => BN254.G2.add(a, b),
			catch: (e) =>
				new Bn254Error({
					operation: "g2Add",
					message: `G2 point addition failed: ${e}`,
					cause: e,
				}),
		}),
	g2Mul: (point, scalar) =>
		Effect.try({
			try: () => BN254.G2.mul(point, scalar),
			catch: (e) =>
				new Bn254Error({
					operation: "g2Mul",
					message: `G2 scalar multiplication failed: ${e}`,
					cause: e,
				}),
		}),
	g2Generator: () =>
		Effect.try({
			try: () => BN254.G2.generator(),
			catch: (e) =>
				new Bn254Error({
					operation: "g2Generator",
					message: `Failed to get G2 generator: ${e}`,
					cause: e,
				}),
		}),
	pairingCheck: (pairs) =>
		Effect.try({
			try: () =>
				BN254.Pairing.pairingCheck(
					pairs as Array<[BN254G1PointType, BN254G2PointType]>,
				),
			catch: (e) =>
				new Bn254Error({
					operation: "pairingCheck",
					message: `Pairing check failed: ${e}`,
					cause: e,
				}),
		}),
});

const mockG1Point: BN254G1PointType = {
	x: 1n,
	y: 2n,
	z: 1n,
} as BN254G1PointType;
const mockG2Point: BN254G2PointType = {
	x: { c0: 1n, c1: 0n },
	y: { c0: 1n, c1: 0n },
	z: { c0: 1n, c1: 0n },
} as BN254G2PointType;

/**
 * Test layer for Bn254Service returning deterministic mock values.
 *
 * @description
 * Provides a mock implementation for unit testing that returns predictable
 * values without performing actual curve operations. Use this layer to test
 * code that depends on Bn254Service without cryptographic overhead.
 *
 * Mock behaviors:
 * - All G1 operations return a fixed mock G1 point
 * - All G2 operations return a fixed mock G2 point
 * - Pairing check always returns true
 *
 * @example
 * ```typescript
 * import { Bn254Service, Bn254Test } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const testProgram = Effect.gen(function* () {
 *   const bn254 = yield* Bn254Service
 *   const result = yield* bn254.pairingCheck([])
 *   return result // always true in test mode
 * }).pipe(Effect.provide(Bn254Test))
 * ```
 *
 * @see {@link Bn254Service} - The service definition
 * @see {@link Bn254Live} - Production implementation
 * @since 0.0.1
 */
export const Bn254Test = Layer.succeed(Bn254Service, {
	g1Add: (_a, _b) => Effect.succeed(mockG1Point),
	g1Mul: (_point, _scalar) => Effect.succeed(mockG1Point),
	g1Generator: () => Effect.succeed(mockG1Point),
	g2Add: (_a, _b) => Effect.succeed(mockG2Point),
	g2Mul: (_point, _scalar) => Effect.succeed(mockG2Point),
	g2Generator: () => Effect.succeed(mockG2Point),
	pairingCheck: (_pairs) => Effect.succeed(true),
});
