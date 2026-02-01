import { type BrandedRlp, Rlp as VoltaireRlp } from "@tevm/voltaire/Rlp";
import * as Effect from "effect/Effect";

/**
 * Type representing RLP list items.
 * @since 0.0.1
 */
type ListItem = Uint8Array | BrandedRlp | ListItem[];

/**
 * RLP-encodes a list of items.
 *
 * @param items - Array of items to encode
 * @returns Effect that succeeds with RLP-encoded bytes (infallible)
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { encodeList } from 'voltaire-effect/primitives/Rlp'
 *
 * const encoded = encodeList([
 *   new Uint8Array([1]),
 *   new Uint8Array([2])
 * ])
 *
 * Effect.runSync(encoded) // Uint8Array([0xc4, 0x01, 0x02])
 * ```
 *
 * @since 0.0.1
 */
export const encodeList = (items: ListItem[]): Effect.Effect<Uint8Array> =>
	Effect.sync(() => VoltaireRlp.encodeList(items));
