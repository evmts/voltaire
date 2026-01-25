import { TransactionHash } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * Branded type for 32-byte transaction hashes.
 * @since 0.0.1
 */
type TransactionHashType = Uint8Array & { readonly __tag: 'TransactionHash' }

/**
 * Error thrown when transaction hash creation fails.
 * 
 * @example
 * ```typescript
 * import { TransactionHashError } from './from.js'
 * 
 * const error = new TransactionHashError('Invalid hash length', originalError)
 * console.log(error._tag) // 'TransactionHashError'
 * ```
 * 
 * @since 0.0.1
 */
export class TransactionHashError extends Error {
  /** Discriminant tag for error identification */
  readonly _tag = 'TransactionHashError'
  
  /**
   * Creates a new TransactionHashError.
   * @param message - Error description
   * @param cause - Original error that caused this failure
   */
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'TransactionHashError'
  }
}

/**
 * Creates a validated TransactionHash from a hex string or bytes.
 * 
 * @param value - Hex string (with or without 0x prefix) or Uint8Array
 * @returns Effect containing the validated TransactionHash or TransactionHashError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from './from.js'
 * 
 * const hash = await Effect.runPromise(from(
 *   '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b'
 * ))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (value: string | Uint8Array): Effect.Effect<TransactionHashType, TransactionHashError> =>
  Effect.try({
    try: () => TransactionHash.from(value) as unknown as TransactionHashType,
    catch: (e) => new TransactionHashError(
      e instanceof Error ? e.message : String(e),
      e
    )
  })

/**
 * Creates a validated TransactionHash from a hex string.
 * 
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Effect containing the validated TransactionHash or TransactionHashError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { fromHex } from './from.js'
 * 
 * const hash = await Effect.runPromise(fromHex('0x88df016...'))
 * ```
 * 
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<TransactionHashType, TransactionHashError> =>
  Effect.try({
    try: () => TransactionHash.fromHex(hex) as unknown as TransactionHashType,
    catch: (e) => new TransactionHashError(
      e instanceof Error ? e.message : String(e),
      e
    )
  })

/**
 * Creates a validated TransactionHash from raw bytes.
 * 
 * @param bytes - 32-byte Uint8Array
 * @returns Effect containing the validated TransactionHash or TransactionHashError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { fromBytes } from './from.js'
 * 
 * const hash = await Effect.runPromise(fromBytes(bytes32))
 * ```
 * 
 * @since 0.0.1
 */
export const fromBytes = (bytes: Uint8Array): Effect.Effect<TransactionHashType, TransactionHashError> =>
  Effect.try({
    try: () => TransactionHash.fromBytes(bytes) as unknown as TransactionHashType,
    catch: (e) => new TransactionHashError(
      e instanceof Error ? e.message : String(e),
      e
    )
  })

/**
 * Converts a TransactionHash to its hex string representation.
 * 
 * @param hash - TransactionHash to convert
 * @returns Hex string with 0x prefix
 * 
 * @example
 * ```typescript
 * import { toHex } from './from.js'
 * 
 * const hexString = toHex(hash)
 * // '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b'
 * ```
 * 
 * @since 0.0.1
 */
export const toHex = (hash: TransactionHashType): string => TransactionHash.toHex(hash as any)
