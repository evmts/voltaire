/**
 * PeerInfo module for Effect-based P2P peer information handling.
 *
 * Provides Effect-wrapped operations for working with detailed peer information
 * including ID, client name, capabilities, network, and protocol details.
 *
 * @example
 * ```typescript
 * import * as PeerInfo from 'voltaire-effect/primitives/PeerInfo'
 * import * as Effect from 'effect/Effect'
 *
 * const info = PeerInfo.from({
 *   id: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8...',
 *   name: 'Geth/v1.10.0',
 *   caps: ['eth/66', 'eth/67'],
 *   network: { localAddress: '127.0.0.1:30303' },
 *   protocols: { eth: { version: 67 } }
 * })
 *
 * Effect.runSync(info)
 * ```
 *
 * @module
 * @since 0.0.1
 */
export { PeerInfoSchema } from './PeerInfoSchema.js'
export { from, PeerInfoError } from './from.js'
