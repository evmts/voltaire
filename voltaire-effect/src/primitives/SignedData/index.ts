/**
 * @module SignedData
 *
 * Effect-based module for working with EIP-191 and EIP-712 signed data.
 * Provides utilities for creating versioned signed data prefixes.
 *
 * @example
 * ```typescript
 * import { SignedData } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const data = yield* SignedData.from(0x45, versionData, payload)
 *   return data
 * })
 * ```
 *
 * @since 0.0.1
 */
export { Schema, SignedDataVersionSchema, type SignedDataType, type SignedDataVersion } from './SignedDataSchema.js'
export { from, SignedDataError } from './from.js'
