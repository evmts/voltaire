/**
 * @module Rlp
 * @description Effect-based RLP (Recursive Length Prefix) encoding and decoding.
 *
 * RLP is the primary serialization format used in Ethereum for encoding
 * transactions, blocks, account state, and other structured data.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Rlp from 'voltaire-effect/primitives/Rlp'
 *
 * function decodeRlp(encoded: Rlp.BrandedRlp) {
 *   // ...
 * }
 * ```
 *
 * ## Schema
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Rlp.Schema` | Uint8Array | BrandedRlp |
 *
 * ## Effect Functions
 *
 * Encoding (can fail on invalid input):
 * - `encode(data)` - Encode bytes or nested arrays
 * - `encodeBytes(bytes)` - Encode a single byte array
 * - `encodeList(items)` - Encode a list of items
 * - `encodeArray(items)` - Encode array to RLP bytes
 *
 * Decoding (can fail on malformed RLP):
 * - `decode(bytes)` - Decode RLP bytes to data structure
 * - `decodeArray(bytes)` - Decode RLP bytes to array
 *
 * Utilities:
 * - `flatten(data)` - Flatten nested RLP to array of bytes
 * - `validate(bytes)` - Check if bytes are valid RLP
 *
 * @example Schema usage
 * ```typescript
 * import * as Rlp from 'voltaire-effect/primitives/Rlp'
 * import * as S from 'effect/Schema'
 *
 * const rlp = S.decodeSync(Rlp.Schema)(rlpBytes)
 * ```
 *
 * @example Effect usage
 * ```typescript
 * import * as Rlp from 'voltaire-effect/primitives/Rlp'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const encoded = yield* Rlp.encode([
 *     new Uint8Array([1, 2, 3]),
 *     new Uint8Array([4, 5, 6])
 *   ])
 *   const { data, remainder } = yield* Rlp.decode(encoded)
 * })
 * ```
 *
 * @since 0.1.0
 */

export type { BrandedRlp } from "@tevm/voltaire/Rlp";
export { type Decoded, decode } from "./decode.js";
export { decodeArray } from "./decodeArray.js";
export { encode } from "./encode.js";
export { encodeArray } from "./encodeArray.js";
export { encodeBytes } from "./encodeBytes.js";
export { encodeList } from "./encodeList.js";
export { flatten } from "./flatten.js";
export { RlpDecodingError, RlpEncodingError, Schema } from "./RlpSchema.js";
export { validate } from "./validate.js";
