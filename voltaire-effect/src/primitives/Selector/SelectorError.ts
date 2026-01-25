/**
 * @fileoverview Error type for Selector operations.
 * @module SelectorError
 * @since 0.0.1
 */

/**
 * Error thrown when selector parsing or validation fails.
 *
 * @example
 * ```typescript
 * import { SelectorError } from 'voltaire-effect/primitives/Selector'
 *
 * Effect.runPromise(Selector.from('invalid')).catch(e => {
 *   if (e instanceof SelectorError) {
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
