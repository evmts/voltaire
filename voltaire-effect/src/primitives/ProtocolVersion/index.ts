/**
 * ProtocolVersion module for Effect-based Ethereum protocol version handling.
 *
 * Provides Effect-wrapped operations for working with Ethereum wire protocol
 * version identifiers (e.g., eth/66, eth/67, snap/1).
 *
 * @example
 * ```typescript
 * import * as ProtocolVersion from 'voltaire-effect/primitives/ProtocolVersion'
 * import * as Effect from 'effect/Effect'
 *
 * const version = ProtocolVersion.from('eth/67')
 * Effect.runSync(version)
 * ```
 *
 * @module
 * @since 0.0.1
 */

export { type ProtocolVersionType, Schema } from "./ProtocolVersionSchema.js";
