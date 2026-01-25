/**
 * BlockHeader module for Ethereum block headers.
 * Contains all block metadata including parent hash, state root, etc.
 * 
 * @example
 * ```typescript
 * import * as BlockHeader from 'voltaire-effect/primitives/BlockHeader'
 * import * as Effect from 'effect/Effect'
 * 
 * const header = await Effect.runPromise(BlockHeader.fromRpc(rpcHeader))
 * const hash = BlockHeader.calculateHash(header)
 * ```
 * 
 * @since 0.0.1
 * @module
 */

export { BlockHeaderSchema, BlockHeaderSchema as Schema } from './BlockHeaderSchema.js'
export { from } from './from.js'
export { fromRpc } from './fromRpc.js'
export { calculateHash } from './calculateHash.js'
