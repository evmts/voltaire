import { BlockBody } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type BlockBodyType = BlockBody.BlockBodyType
type RpcBlockBody = BlockBody.RpcBlockBody

/**
 * Creates a BlockBody from JSON-RPC response format.
 * Converts hex-encoded RPC data to typed block body.
 * Never throws - returns Effect with error in channel.
 * 
 * @param rpc - Block body in JSON-RPC format
 * @returns Effect yielding BlockBodyType or failing with Error
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BlockBody from 'voltaire-effect/primitives/BlockBody'
 * 
 * const body = await Effect.runPromise(BlockBody.fromRpc(rpcResponse))
 * ```
 * 
 * @since 0.0.1
 */
export const fromRpc = (rpc: RpcBlockBody): Effect.Effect<BlockBodyType, Error> =>
  Effect.try({
    try: () => BlockBody.fromRpc(rpc),
    catch: (e) => e as Error
  })
