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
 * ## API Design
 *
 * ### Pure Functions (Direct Return)
 * - `equals(a, b)` - boolean
 * - `isData(value)` - boolean (type guard)
 * - `isBytesData(value)` - boolean (type guard)
 * - `isListData(value)` - boolean (type guard)
 * - `isCanonical(bytes)` - boolean
 * - `toJSON(data)` - unknown
 * - `toRaw(data)` - Uint8Array | unknown[]
 *
 * ### Effect-Returning Functions (Fallible)
 *
 * Encoding:
 * - `encode(data)` - Effect<Uint8Array, RlpEncodingError>
 * - `encodeBytes(bytes)` - Effect<Uint8Array>
 * - `encodeList(items)` - Effect<Uint8Array>
 * - `encodeArray(items)` - Effect<Uint8Array>
 * - `encodeObject(obj)` - Effect<Uint8Array, RlpEncodingError>
 * - `encodeBatch(items)` - Effect<Uint8Array[], RlpEncodingError>
 * - `encodeVariadic(...items)` - Effect<Uint8Array, RlpEncodingError>
 *
 * Decoding:
 * - `decode(bytes)` - Effect<Decoded, RlpDecodingError>
 * - `decodeArray(bytes)` - Effect<unknown[], RlpDecodingError>
 * - `decodeObject(bytes)` - Effect<Record<string, unknown>, RlpDecodingError>
 * - `decodeValue(bytes)` - Effect<Uint8Array | unknown[], RlpDecodingError>
 * - `decodeBatch(items)` - Effect<unknown[][], RlpDecodingError>
 *
 * Utilities:
 * - `from(value)` - Effect<BrandedRlp, RlpEncodingError>
 * - `fromJSON(json)` - Effect<BrandedRlp, RlpDecodingError>
 * - `flatten(data)` - Effect<Array<BrandedRlp & { type: "bytes" }>>
 * - `validate(bytes)` - Effect<boolean>
 * - `isList(bytes)` - Effect<boolean, RlpDecodingError>
 * - `isString(bytes)` - Effect<boolean, RlpDecodingError>
 * - `getLength(bytes)` - Effect<number, RlpDecodingError>
 * - `getEncodedLength(data)` - Effect<number, RlpEncodingError>
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

// Type exports
export type { BrandedRlp } from "@tevm/voltaire/Rlp";

// Schema and errors
export { RlpDecodingError, RlpEncodingError, Schema } from "./RlpSchema.js";

// Pure functions (direct return)
export { equals } from "./equals.js";
export { isCanonical } from "./isCanonical.js";
export { isBytesData } from "./isBytesData.js";
export { isData } from "./isData.js";
export { isListData } from "./isListData.js";
export { toJSON } from "./toJSON.js";
export { toRaw } from "./toRaw.js";

// Effect-returning encoding functions
export { encode } from "./encode.js";
export { encodeArray } from "./encodeArray.js";
export { encodeBatch } from "./encodeBatch.js";
export { encodeBytes } from "./encodeBytes.js";
export { encodeList } from "./encodeList.js";
export { encodeObject } from "./encodeObject.js";
export { encodeVariadic } from "./encodeVariadic.js";

// Effect-returning decoding functions
export { type Decoded, decode } from "./decode.js";
export { decodeArray } from "./decodeArray.js";
export { decodeBatch } from "./decodeBatch.js";
export { decodeObject } from "./decodeObject.js";
export { decodeValue } from "./decodeValue.js";

// Effect-returning utility functions
export { flatten } from "./flatten.js";
export { from } from "./from.js";
export { fromJSON } from "./fromJSON.js";
export { getEncodedLength } from "./getEncodedLength.js";
export { getLength } from "./getLength.js";
export { isList } from "./isList.js";
export { isString } from "./isString.js";
export { validate } from "./validate.js";
