import { AccessList, type BrandedAccessList, type Item } from '@tevm/voltaire/AccessList'
import { ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when access list validation fails.
 * 
 * @since 0.0.1
 */
export class AccessListError extends Error {
  /** Error discriminator tag for pattern matching */
  readonly _tag = 'AccessListError'
  
  /**
   * Creates a new AccessListError.
   * 
   * @param message - Human-readable error message
   * @param context - Additional error context
   * 
   * @since 0.0.1
   */
  constructor(
    message: string,
    readonly context?: { value?: unknown; expected?: string; cause?: Error }
  ) {
    super(message)
    this.name = 'AccessListError'
  }
}

/**
 * Creates an AccessList from an array of items or bytes.
 * Never throws - returns Effect with error in channel.
 * 
 * @param value - Array of access list items or RLP-encoded bytes
 * @returns Effect yielding BrandedAccessList or failing with AccessListError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 * 
 * const result = await Effect.runPromise(AccessList.from([
 *   { address: addressBytes, storageKeys: [key1, key2] }
 * ]))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (value: readonly Item[] | Uint8Array): Effect.Effect<BrandedAccessList, AccessListError> =>
  Effect.try({
    try: () => AccessList.from(value),
    catch: (e) => {
      if (e instanceof ValidationError) {
        return new AccessListError(e.message, { value, expected: 'valid access list', cause: e })
      }
      return new AccessListError(
        e instanceof Error ? e.message : String(e),
        { value, expected: 'valid access list', cause: e instanceof Error ? e : undefined }
      )
    }
  })

/**
 * Creates an empty AccessList.
 * Pure function - always succeeds synchronously.
 * 
 * @returns Empty BrandedAccessList
 * 
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 * 
 * const emptyList = AccessList.create()
 * ```
 * 
 * @since 0.0.1
 */
export const create = (): BrandedAccessList => AccessList.create()
