import { TransactionUrl } from '@tevm/voltaire'
import type { TransactionUrlType } from './TransactionUrlSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when transaction URL creation fails.
 * 
 * @example
 * ```typescript
 * import { TransactionUrlError } from './from.js'
 * 
 * const error = new TransactionUrlError('Invalid URL format')
 * ```
 * 
 * @since 0.0.1
 */
export class TransactionUrlError {
  /** Discriminant tag for error identification */
  readonly _tag = 'TransactionUrlError'
  
  /**
   * Creates a new TransactionUrlError.
   * @param message - Error description
   */
  constructor(readonly message: string) {}
}

/**
 * Creates a validated TransactionUrl from an EIP-681 URL string.
 * 
 * @param value - EIP-681 format URL string (e.g., 'ethereum:0x...?value=1e18')
 * @returns Effect containing the validated TransactionUrl or TransactionUrlError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from './from.js'
 * 
 * const url = await Effect.runPromise(from('ethereum:0x123...?value=1e18'))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (value: string): Effect.Effect<TransactionUrlType, TransactionUrlError> =>
  Effect.try({
    try: () => TransactionUrl.from(value),
    catch: (e) => new TransactionUrlError((e as Error).message)
  })

/**
 * Parses a TransactionUrl into its component parts.
 * 
 * @param url - TransactionUrl to parse
 * @returns Parsed URL components (address, chainId, value, etc.)
 * 
 * @example
 * ```typescript
 * import { parse } from './from.js'
 * 
 * const { address, value, chainId } = parse(url)
 * ```
 * 
 * @since 0.0.1
 */
export const parse = (url: TransactionUrlType): ReturnType<typeof TransactionUrl.parse> => TransactionUrl.parse(url)

/**
 * Formats transaction parameters into an EIP-681 URL.
 * 
 * @param params - Transaction parameters to encode
 * @returns Formatted TransactionUrl
 * 
 * @example
 * ```typescript
 * import { format } from './from.js'
 * 
 * const url = format({ address: '0x123...', value: '1000000000000000000' })
 * ```
 * 
 * @since 0.0.1
 */
export const format = (params: Parameters<typeof TransactionUrl.format>[0]): TransactionUrlType => 
  TransactionUrl.format(params)
