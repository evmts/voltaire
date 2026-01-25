/**
 * TransactionUrl module for handling EIP-681 transaction URLs.
 * 
 * EIP-681 defines a URL format for encoding Ethereum transactions,
 * useful for QR codes and payment links.
 * 
 * @example
 * ```typescript
 * import * as TransactionUrl from './index.js'
 * import * as Effect from 'effect/Effect'
 * 
 * const url = await Effect.runPromise(TransactionUrl.from('ethereum:0x123...'))
 * const params = TransactionUrl.parse(url)
 * const formatted = TransactionUrl.format({ address: '0x...' })
 * ```
 * 
 * @module TransactionUrl
 * @since 0.0.1
 */
export { Schema, type TransactionUrlType } from './TransactionUrlSchema.js'
export { from, parse, format, TransactionUrlError } from './from.js'
