import { BlockHeader } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type BlockHeaderType = BlockHeader.BlockHeaderType
type RpcBlockHeader = BlockHeader.RpcBlockHeader

/**
 * Creates a BlockHeader from JSON-RPC response format.
 * Converts hex-encoded RPC data to typed block header.
 * Never throws - returns Effect with error in channel.
 * 
 * @param rpc - Block header in JSON-RPC format
 * @returns Effect yielding BlockHeaderType or failing with Error
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BlockHeader from 'voltaire-effect/primitives/BlockHeader'
 * 
 * const header = await Effect.runPromise(BlockHeader.fromRpc(rpcResponse))
 * ```
 * 
 * @since 0.0.1
 */
export const fromRpc = (rpc: RpcBlockHeader): Effect.Effect<BlockHeaderType, Error> =>
  Effect.try({
    try: () => BlockHeader.fromRpc(rpc),
    catch: (e) => e as Error
  })
