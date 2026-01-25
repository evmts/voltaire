/**
 * UserOperation module for ERC-4337 account abstraction.
 * 
 * Provides types and functions for creating, hashing, and packing
 * UserOperations for smart contract wallets.
 * 
 * @example
 * ```typescript
 * import * as UserOperation from './index.js'
 * import * as Effect from 'effect/Effect'
 * 
 * const userOp = await Effect.runPromise(UserOperation.from({
 *   sender: '0x...',
 *   nonce: 0n,
 *   // ... other fields
 * }))
 * 
 * const hash = await Effect.runPromise(UserOperation.hash(userOp, entryPoint, 1n))
 * ```
 * 
 * @module UserOperation
 * @since 0.0.1
 */
export { type UserOperationType, UserOperationSchema, type UserOperationInput } from './UserOperationSchema.js'
export { from, type UserOperationFromParams } from './from.js'
export { hash } from './hash.js'
export { pack } from './pack.js'
