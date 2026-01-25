/**
 * TypedData module for EIP-712 structured data hashing and signing.
 * 
 * EIP-712 defines a standard for typed structured data hashing,
 * enabling human-readable signing prompts in wallets.
 * 
 * @example
 * ```typescript
 * import * as TypedData from './index.js'
 * import * as Effect from 'effect/Effect'
 * 
 * const typedData = await Effect.runPromise(TypedData.from({
 *   types: {
 *     EIP712Domain: [{ name: 'name', type: 'string' }],
 *     Person: [{ name: 'name', type: 'string' }]
 *   },
 *   primaryType: 'Person',
 *   domain: { name: 'My App' },
 *   message: { name: 'Bob' }
 * }))
 * ```
 * 
 * @module TypedData
 * @since 0.0.1
 */
export { TypedDataSchema, type TypedDataInput, type DomainInput, type TypedDataFieldInput } from './TypedDataSchema.js'
export { from, TypedDataError } from './from.js'
