/**
 * @fileoverview EntryPoint module for ERC-4337 account abstraction.
 * 
 * The EntryPoint is the central contract in ERC-4337 that handles UserOperation
 * validation and execution. It is a singleton contract deployed at a deterministic
 * address on each chain.
 * 
 * This module provides Effect-based schemas and functions for working with
 * EntryPoint contract addresses.
 * 
 * @example
 * ```typescript
 * import * as EntryPoint from 'voltaire-effect/primitives/EntryPoint'
 * import * as Effect from 'effect/Effect'
 * 
 * // Create EntryPoint from well-known address
 * const entryPoint = Effect.runSync(EntryPoint.from(EntryPoint.V07))
 * 
 * // Compare EntryPoints
 * const areEqual = Effect.runSync(EntryPoint.equals(ep1, ep2))
 * 
 * // Convert to hex
 * const hex = Effect.runSync(EntryPoint.toHex(entryPoint))
 * ```
 * 
 * @see https://eips.ethereum.org/EIPS/eip-4337#entrypoint-definition
 * @module EntryPoint
 * @since 0.0.1
 */

/** Schema and types for EntryPoint */
export { EntryPointSchema, type EntryPointType, ENTRYPOINT_V06, ENTRYPOINT_V07 } from './EntryPointSchema.js'

/** Functions for working with EntryPoints */
export {
  from,
  toHex,
  equals,
  EntryPointError,
  /** Alias for ENTRYPOINT_V06 */
  ENTRYPOINT_V06 as V06,
  /** Alias for ENTRYPOINT_V07 */
  ENTRYPOINT_V07 as V07
} from './from.js'
