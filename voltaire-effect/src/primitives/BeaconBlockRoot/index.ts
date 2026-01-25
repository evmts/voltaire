/**
 * BeaconBlockRoot module for Ethereum beacon chain block roots.
 * Provides Effect-based schemas and functions for 32-byte beacon roots.
 * 
 * @example
 * ```typescript
 * import * as BeaconBlockRoot from 'voltaire-effect/primitives/BeaconBlockRoot'
 * import * as Effect from 'effect/Effect'
 * 
 * const root = await Effect.runPromise(BeaconBlockRoot.from('0x...'))
 * ```
 * 
 * @since 0.0.1
 * @module
 */

export { BeaconBlockRootSchema, BeaconBlockRootSchema as Schema } from './BeaconBlockRootSchema.js'
export { from } from './from.js'
export { toHex } from './toHex.js'
