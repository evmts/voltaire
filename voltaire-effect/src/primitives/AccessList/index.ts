/**
 * AccessList module for EIP-2930 access lists.
 * Provides Effect-based schemas and constructors for access list management.
 * 
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 * import * as Effect from 'effect/Effect'
 * 
 * const accessList = await Effect.runPromise(
 *   AccessList.from([{ address: addrBytes, storageKeys: [key1] }])
 * )
 * ```
 * 
 * @since 0.0.1
 * @module
 */

export { AccessListSchema, type AccessListInput, type AccessListItemInput } from './AccessListSchema.js'
export { from, create, AccessListError } from './from.js'
