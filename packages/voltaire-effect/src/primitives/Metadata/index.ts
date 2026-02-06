/**
 * Metadata module for working with contract metadata in Effect.
 * Contract metadata is CBOR-encoded data appended to the end of contract bytecode,
 * containing information like compiler version, source hash, and IPFS/Swarm links.
 *
 * @example
 * ```typescript
 * import * as Metadata from 'voltaire-effect/Metadata'
 * import * as Effect from 'effect/Effect'
 *
 * // Parse metadata from bytecode
 * const metadataBytes = new Uint8Array([0xa2, 0x64, 0x69, 0x70, 0x66, 0x73])
 * const metadata = Effect.runSync(Metadata.from(metadataBytes))
 *
 * // Using the Schema for validation
 * import * as S from 'effect/Schema'
 * const parsed = S.decodeSync(Metadata.MetadataSchema)(metadataBytes)
 * ```
 *
 * @since 0.0.1
 * @module
 */

export { MetadataSchema } from "./MetadataSchema.js";
