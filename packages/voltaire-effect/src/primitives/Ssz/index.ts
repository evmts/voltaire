/**
 * @module Ssz
 * @description Effect Schema for SSZ (Simple Serialize) encoded data.
 *
 * SSZ is the serialization format used by Ethereum's consensus layer
 * (Beacon chain) for blocks, attestations, and other protocol data.
 *
 * ## Schema
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Ssz.Schema` | Uint8Array | SszType |
 *
 * @example Decoding
 * ```typescript
 * import * as Ssz from 'voltaire-effect/primitives/Ssz'
 * import * as S from 'effect/Schema'
 *
 * const ssz = S.decodeSync(Ssz.Schema)(new Uint8Array([1, 2, 3]))
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(Ssz.Schema)(sszData)
 * ```
 *
 * @since 0.1.0
 */
export { Schema, type SszType } from "./SszSchema.js";
