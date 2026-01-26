import {
	type BrandedRlp,
	type RlpEncodingError,
	RlpEncodingError as RlpEncodingErrorClass,
	Rlp as VoltaireRlp,
} from "@tevm/voltaire/Rlp";
import * as Effect from "effect/Effect";

/**
 * Type representing RLP-encodable data (bytes or nested arrays).
 * @since 0.0.1
 */
type Encodable = Uint8Array | BrandedRlp | Encodable[];

const isRlpEncodingError = (e: unknown): e is RlpEncodingError =>
	e instanceof RlpEncodingErrorClass ||
	(e !== null &&
		typeof e === "object" &&
		"name" in e &&
		e.name === "RlpEncodingError");

/**
 * RLP-encodes data using Effect for error handling.
 *
 * @param data - Data to encode (bytes or nested arrays)
 * @returns Effect that succeeds with RLP-encoded bytes or fails with RlpEncodingError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { encode } from 'voltaire-effect/primitives/Rlp'
 *
 * // Encode bytes
 * const encoded1 = encode(new Uint8Array([1, 2, 3]))
 *
 * // Encode nested list
 * const encoded2 = encode([
 *   new Uint8Array([1]),
 *   [new Uint8Array([2]), new Uint8Array([3])]
 * ])
 *
 * Effect.runSync(encoded1)
 * ```
 *
 * @since 0.0.1
 */
export const encode = (
	data: Encodable,
): Effect.Effect<Uint8Array, RlpEncodingError> =>
	Effect.try({
		try: () => VoltaireRlp.encode(data),
		catch: (e) =>
			isRlpEncodingError(e)
				? e
				: new RlpEncodingErrorClass("RLP encoding failed", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
