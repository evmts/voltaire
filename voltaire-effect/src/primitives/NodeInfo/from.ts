import { NodeInfo } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * The NodeInfo type representing Ethereum node information.
 * @since 0.0.1
 */
type NodeInfoType = ReturnType<typeof NodeInfo.from>

/**
 * Error thrown when NodeInfo parsing fails due to invalid input.
 *
 * @example
 * ```typescript
 * import * as NodeInfo from 'voltaire-effect/NodeInfo'
 * import * as Effect from 'effect/Effect'
 *
 * const result = NodeInfo.from({})
 * Effect.runSync(Effect.either(result))
 * // Left(NodeInfoError { message: '...' })
 * ```
 *
 * @since 0.0.1
 */
export class NodeInfoError extends Error {
  readonly _tag = 'NodeInfoError'
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'NodeInfoError'
  }
}

/**
 * Creates a NodeInfo from an object, wrapped in an Effect.
 * Validates that the input contains required node information fields.
 *
 * @param value - An object containing node information (enode, id, ip, name, ports, protocols)
 * @returns An Effect that resolves to NodeInfoType or fails with NodeInfoError
 *
 * @example
 * ```typescript
 * import * as NodeInfo from 'voltaire-effect/NodeInfo'
 * import * as Effect from 'effect/Effect'
 *
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
 */
export function from(value: unknown): Effect.Effect<NodeInfoType, NodeInfoError> {
  return Effect.try({
    try: () => NodeInfo.from(value),
    catch: (e) => new NodeInfoError((e as Error).message, e)
  })
}
