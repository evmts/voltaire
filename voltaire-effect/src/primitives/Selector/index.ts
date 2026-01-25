/**
 * @fileoverview Effect-based module for working with EVM function selectors.
 * @module Selector
 * @since 0.0.1
 *
 * @description
 * Selectors are 4-byte identifiers derived from function signatures using keccak256.
 * They are used in EVM call data to identify which function to invoke on a contract.
 *
 * This module provides:
 * - Type-safe branded SelectorType
 * - Effect Schema for validation
 * - Functions for creating, converting, and comparing selectors
 *
 * @example
 * ```typescript
 * import { Selector } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // Create from function signature
 *   const selector = yield* Selector.fromSignature('transfer(address,uint256)')
 *
 *   // Convert to hex
 *   const hex = yield* Selector.toHex(selector)
 *   console.log(hex) // '0xa9059cbb'
 *
 *   // Compare selectors
 *   const other = yield* Selector.from('0xa9059cbb')
 *   const equal = yield* Selector.equals(selector, other)
 *   console.log(equal) // true
 * })
 * ```
 *
 * @see {@link SelectorSchema} for Effect Schema integration
 * @see {@link SelectorType} for the branded type
 * @see {@link SelectorError} for error handling
 */
export { SelectorSchema, type SelectorType } from './SelectorSchema.js'
export {
  from,
  fromHex,
  fromSignature,
  toHex,
  equals,
  SelectorError,
  type SelectorLike
} from './from.js'
