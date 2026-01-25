/**
 * @fileoverview Effect-based module for working with EVM function selectors.
 * @module Selector
 * @since 0.0.1
 *
 * @description
 * Selectors are 4-byte identifiers derived from function signatures using keccak256.
 * They are used in EVM call data to identify which function to invoke on a contract.
 *
 * @example
 * ```typescript
 * import * as Selector from 'voltaire-effect/primitives/Selector'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const selector = yield* Selector.fromSignature('transfer(address,uint256)')
 *   const hex = yield* Selector.toHex(selector)
 *   console.log(hex) // '0xa9059cbb'
 * })
 * ```
 */

export { SelectorSchema, type SelectorType } from './SelectorSchema.js'
export { SelectorError } from './SelectorError.js'
export { from, type SelectorLike } from './from.js'
export { fromHex } from './fromHex.js'
export { fromSignature } from './fromSignature.js'
export { toHex } from './toHex.js'
export { toBytes } from './toBytes.js'
export { equals } from './equals.js'
