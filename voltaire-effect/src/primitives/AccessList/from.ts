/**
 * @fileoverview Factory functions for creating EIP-2930 Access Lists.
 * Provides Effect-based constructors with typed error handling.
 *
 * @module AccessList/from
 * @since 0.0.1
 */

import { AccessList, type BrandedAccessList, type Item } from '@tevm/voltaire/AccessList'
import { ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when access list validation fails.
 *
 * @description
 * Represents a failure to create or validate an access list. Contains
 * the original error context including the invalid value, expected format,
 * and underlying cause. Uses Effect's tagged error pattern for type-safe
 * error handling with `Effect.catchTag`.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * const result = await Effect.runPromise(
 *   AccessList.from(invalidData).pipe(
 *     Effect.catchTag('AccessListError', (error) => {
 *       console.error('Invalid access list:', error.message)
 *       console.error('Context:', error.context)
 *       return Effect.succeed(AccessList.create())
 *     })
 *   )
 * )
 * ```
 */
export class AccessListError extends Error {
  /**
   * Error discriminator tag for pattern matching.
   * Used by Effect.catchTag for type-safe error handling.
   */
  readonly _tag = 'AccessListError'

  /**
   * Creates a new AccessListError.
   *
   * @param {string} message - Human-readable error message describing what went wrong.
   * @param {Object} [context] - Additional error context for debugging.
   * @param {unknown} [context.value] - The invalid value that caused the error.
   * @param {string} [context.expected] - Description of what was expected.
   * @param {Error} [context.cause] - The underlying error that caused this failure.
   *
   * @since 0.0.1
   *
   * @example
   * ```typescript
   * throw new AccessListError('Invalid address length', {
   *   value: '0x123',
   *   expected: '20-byte address',
   *   cause: originalError
   * })
   * ```
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
 *
 * @description
 * Constructs a branded `BrandedAccessList` from either:
 * - An array of access list items (address + storage keys)
 * - RLP-encoded bytes (for deserialization)
 *
 * This function never throws exceptions. Instead, it returns an Effect
 * that may fail with `AccessListError` containing context about what
 * went wrong.
 *
 * @param {readonly Item[] | Uint8Array} value - Array of access list items or RLP-encoded bytes.
 *   Each item must have a valid 20-byte address and array of 32-byte storage keys.
 *
 * @returns {Effect.Effect<BrandedAccessList, AccessListError>}
 *   Effect yielding `BrandedAccessList` on success, or failing with
 *   `AccessListError` if validation fails.
 *
 * @throws {AccessListError} When the input fails validation:
 *   - Invalid address format or length
 *   - Invalid storage key format or length
 *   - Malformed RLP bytes
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * // From array of items
 * const result = await Effect.runPromise(AccessList.from([
 *   {
 *     address: addressBytes,  // 20-byte Uint8Array
 *     storageKeys: [key1, key2]  // Array of 32-byte Uint8Arrays
 *   }
 * ]))
 * ```
 *
 * @example
 * ```typescript
 * // From RLP-encoded bytes
 * const fromRlp = await Effect.runPromise(AccessList.from(rlpBytes))
 * ```
 *
 * @example
 * ```typescript
 * // Handle validation errors
 * const accessList = await Effect.runPromise(
 *   AccessList.from(userInput).pipe(
 *     Effect.catchTag('AccessListError', (e) => {
 *       console.error(`Validation failed: ${e.message}`)
 *       return Effect.succeed(AccessList.create())
 *     })
 *   )
 * )
 * ```
 *
 * @since 0.0.1
 * @see {@link create} for creating empty access lists
 * @see {@link AccessListSchema} for schema-based validation
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
 *
 * @description
 * Returns an empty branded access list. This is a pure synchronous function
 * that never fails. Useful as a default value or starting point for building
 * access lists programmatically.
 *
 * @returns {BrandedAccessList} Empty branded access list (empty array).
 *
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * // Create empty access list
 * const emptyList = AccessList.create()
 *
 * // Use as default
 * const accessList = maybeAccessList ?? AccessList.create()
 * ```
 *
 * @example
 * ```typescript
 * // Use as fallback in Effect pipeline
 * const accessList = await Effect.runPromise(
 *   AccessList.from(input).pipe(
 *     Effect.catchAll(() => Effect.succeed(AccessList.create()))
 *   )
 * )
 * ```
 *
 * @since 0.0.1
 * @see {@link from} for creating access lists from data
 */
export const create = (): BrandedAccessList => AccessList.create()
