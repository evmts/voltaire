import { Selector } from '@tevm/voltaire'
import type { SelectorType } from './SelectorSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when selector parsing or validation fails.
 *
 * @example
 * ```typescript
 * import { Selector } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * Effect.runPromise(Selector.from('invalid')).catch(e => {
 *   if (e instanceof Selector.SelectorError) {
 *     console.error('Selector error:', e.message)
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export class SelectorError extends Error {
  readonly _tag = 'SelectorError'
  constructor(message: string) {
    super(message)
    this.name = 'SelectorError'
  }
}

/**
 * Union type representing valid inputs for creating a Selector.
 *
 * @since 0.0.1
 */
export type SelectorLike = SelectorType | string | Uint8Array

/**
 * Creates a Selector from a hex string, Uint8Array, or existing SelectorType.
 *
 * @param {SelectorLike} value - The value to convert to a Selector
 * @returns {Effect.Effect<SelectorType, SelectorError>} Effect containing the Selector or an error
 *
 * @example
 * ```typescript
 * import { Selector } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const selector = Selector.from('0xa9059cbb')
 * Effect.runPromise(selector).then(console.log)
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: SelectorLike): Effect.Effect<SelectorType, SelectorError> =>
  Effect.try({
    try: () => Selector.from(value) as unknown as SelectorType,
    catch: (e) => new SelectorError((e as Error).message)
  })

/**
 * Creates a Selector from a hex string.
 *
 * @param {string} hex - The hex string (with or without 0x prefix)
 * @returns {Effect.Effect<SelectorType, SelectorError>} Effect containing the Selector or an error
 *
 * @example
 * ```typescript
 * import { Selector } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const selector = Selector.fromHex('0xa9059cbb')
 * Effect.runPromise(selector).then(console.log)
 * ```
 *
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<SelectorType, SelectorError> =>
  Effect.try({
    try: () => Selector.fromHex(hex) as unknown as SelectorType,
    catch: (e) => new SelectorError((e as Error).message)
  })

/**
 * Creates a Selector from a function signature by hashing it with keccak256.
 *
 * @param {string} signature - The function signature (e.g., "transfer(address,uint256)")
 * @returns {Effect.Effect<SelectorType, SelectorError>} Effect containing the Selector or an error
 *
 * @example
 * ```typescript
 * import { Selector } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const selector = Selector.fromSignature('transfer(address,uint256)')
 * Effect.runPromise(selector).then(console.log) // 0xa9059cbb
 * ```
 *
 * @since 0.0.1
 */
export const fromSignature = (signature: string): Effect.Effect<SelectorType, SelectorError> =>
  Effect.try({
    try: () => Selector.fromSignature(signature) as unknown as SelectorType,
    catch: (e) => new SelectorError((e as Error).message)
  })

/**
 * Converts a Selector to its hex string representation.
 *
 * @param {SelectorType} selector - The selector to convert
 * @returns {Effect.Effect<string, never>} Effect containing the hex string
 *
 * @example
 * ```typescript
 * import { Selector } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const selector = yield* Selector.from('0xa9059cbb')
 *   const hex = yield* Selector.toHex(selector)
 *   return hex // '0xa9059cbb'
 * })
 * ```
 *
 * @since 0.0.1
 */
export const toHex = (selector: SelectorType): Effect.Effect<string, never> =>
  Effect.succeed(Selector.toHex(selector as unknown as Parameters<typeof Selector.toHex>[0]))

/**
 * Compares two Selectors for equality.
 *
 * @param {SelectorType} a - First selector
 * @param {SelectorType} b - Second selector
 * @returns {Effect.Effect<boolean, never>} Effect containing true if selectors are equal
 *
 * @example
 * ```typescript
 * import { Selector } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const a = yield* Selector.from('0xa9059cbb')
 *   const b = yield* Selector.fromSignature('transfer(address,uint256)')
 *   return yield* Selector.equals(a, b) // true
 * })
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: SelectorType, b: SelectorType): Effect.Effect<boolean, never> =>
  Effect.succeed(Selector.equals(
    a as unknown as Parameters<typeof Selector.equals>[0],
    b as unknown as Parameters<typeof Selector.equals>[0]
  ))
