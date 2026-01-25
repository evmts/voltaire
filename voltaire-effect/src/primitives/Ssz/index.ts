/**
 * @module Ssz
 *
 * Effect-based module for working with SSZ (Simple Serialize) encoded data.
 * SSZ is the serialization format used by Ethereum's consensus layer.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Ssz } from 'voltaire-effect/primitives'
 *
 * const parse = S.decodeSync(Ssz.Schema)
 * const sszData = parse(new Uint8Array([1, 2, 3]))
 * ```
 *
 * @since 0.0.1
 */
export { Schema, type SszType } from './SszSchema.js'
