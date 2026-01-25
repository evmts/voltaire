/**
 * @fileoverview Bundle module for ERC-4337 account abstraction.
 *
 * A Bundle is a collection of UserOperations that a Bundler submits to the
 * EntryPoint contract in a single transaction.
 *
 * @example
 * ```typescript
 * import * as Bundle from 'voltaire-effect/primitives/Bundle'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const bundle = yield* Bundle.from({
 *     userOperations: [userOp1, userOp2],
 *     beneficiary: '0x...',
 *     entryPoint: '0x...'
 *   })
 *   yield* Bundle.validate(bundle)
 *   const gas = yield* Bundle.totalGas(bundle)
 *   return { bundle, gas }
 * })
 * ```
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @module Bundle
 * @since 0.0.1
 */
export {
	type BundleInput,
	BundleSchema,
	type BundleType,
} from "./BundleSchema.js";
