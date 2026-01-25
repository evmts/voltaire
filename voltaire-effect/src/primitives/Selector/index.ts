/**
 * @module Selector
 *
 * Effect-based module for working with EVM function selectors.
 * Selectors are 4-byte identifiers derived from function signatures.
 *
 * @example
 * ```typescript
 * import { Selector } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const selector = yield* Selector.fromSignature('transfer(address,uint256)')
 *   const hex = yield* Selector.toHex(selector)
 *   console.log(hex) // '0xa9059cbb'
 * })
 * ```
 *
 * @since 0.0.1
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
