/**
 * NodeInfo module for working with Ethereum node information in Effect.
 * Contains details about a node including enode URL, node ID, IP address,
 * client name, ports, and supported protocols.
 *
 * @example
 * ```typescript
 * import * as NodeInfo from 'voltaire-effect/NodeInfo'
 * import * as Effect from 'effect/Effect'
 *
 * // Parse node info from RPC response
 * const nodeInfo = Effect.runSync(NodeInfo.from({
 *   enode: 'enode://abc123@127.0.0.1:30303',
 *   id: 'abc123',
 *   ip: '127.0.0.1',
 *   name: 'Geth/v1.10.0',
 *   ports: { discovery: 30303, listener: 30303 },
 *   protocols: { eth: { network: 1 } }
 * }))
 * ```
 *
 * @since 0.0.1
 * @module
 */
export { NodeInfoSchema } from './NodeInfoSchema.js'
export { from, NodeInfoError } from './from.js'
