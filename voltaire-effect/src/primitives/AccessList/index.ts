/**
 * @fileoverview AccessList module for EIP-2930 access lists.
 * Provides Effect-based schemas and constructors for access list management.
 *
 * EIP-2930 access lists allow transactions to pre-declare which accounts and
 * storage slots will be accessed, enabling gas savings and predictable costs.
 * This module provides:
 * - Schema validation for access list data
 * - Effect-based constructors for creating access lists
 * - Type-safe error handling through Effect's error channel
 *
 * @module AccessList
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 * import * as Effect from 'effect/Effect'
 *
 * // Create an access list from items
 * const accessList = await Effect.runPromise(
 *   AccessList.from([
 *     {
 *       address: addressBytes,
 *       storageKeys: [storageKey1, storageKey2]
 *     }
 *   ])
 * )
 *
 * // Create an empty access list
 * const emptyList = AccessList.create()
 *
 * // Validate with Schema
 * import * as Schema from 'effect/Schema'
 * const validated = Schema.decodeSync(AccessList.AccessListSchema)([
 *   { address: '0x...', storageKeys: ['0x...'] }
 * ])
 * ```
 *
 * @see {@link AccessListSchema} for schema-based validation
 * @see {@link from} for Effect-based construction
 * @see {@link create} for creating empty access lists
 * @see {@link AccessListError} for error handling
 */

export { AccessListSchema, type AccessListInput, type AccessListItemInput } from './AccessListSchema.js'
export { from, create, AccessListError } from './from.js'
