import { type BrandedRlp, Rlp as VoltaireRlp } from "@tevm/voltaire/Rlp";
import * as Effect from "effect/Effect";

/**
 * Type representing RLP-encodable array items.
 * @since 0.0.1
 */
type Encodable = Uint8Array | BrandedRlp | Encodable[];

/**
 * RLP-encodes an array of values.
 *
 * @param items - Array of values to encode
 * @returns Effect that succeeds with RLP-encoded bytes (infallible)
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { encodeArray } from 'voltaire-effect/primitives/Rlp'
 *
 * const encoded = encodeArray([
 *   new Uint8Array([1, 2, 3]),
 *   new Uint8Array([4, 5, 6])
 * ])
 *
 * Effect.runSync(encoded)
 * ```
 *
 * @since 0.0.1
 */
export const encodeArray = (items: Encodable[]): Effect.Effect<Uint8Array> =>
	Effect.sync(() => VoltaireRlp.encodeArray(items));
