/**
 * BlockBody module for Ethereum block bodies.
 * Contains transactions, ommers, and withdrawals.
 * 
 * @example
 * ```typescript
 * import * as BlockBody from 'voltaire-effect/primitives/BlockBody'
 * import * as Effect from 'effect/Effect'
 * 
 * const body = await Effect.runPromise(BlockBody.fromRpc(rpcBody))
 * ```
 * 
 * @since 0.0.1
 * @module
 */

export { BlockBodySchema, BlockBodySchema as Schema } from './BlockBodySchema.js'
export { from } from './from.js'
export { fromRpc } from './fromRpc.js'
