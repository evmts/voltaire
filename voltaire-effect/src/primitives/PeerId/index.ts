/**
 * PeerId module for Effect-based peer identifier handling.
 *
 * Provides Effect-wrapped operations for working with P2P network peer IDs.
 *
 * @example
 * ```typescript
 * import * as PeerId from 'voltaire-effect/primitives/PeerId'
 * import * as Effect from 'effect/Effect'
 *
 * const peerId = PeerId.from('QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8...')
 * Effect.runSync(peerId)
 * ```
 *
 * @module
 * @since 0.0.1
 */

export { PeerIdSchema } from "./PeerIdSchema.js";
