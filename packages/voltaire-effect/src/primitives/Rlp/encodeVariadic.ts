import {
	type BrandedRlp,
	type RlpEncodingError,
	RlpEncodingError as RlpEncodingErrorClass,
	Rlp as VoltaireRlp,
} from "@tevm/voltaire/Rlp";
import * as Effect from "effect/Effect";

type Encodable = Uint8Array | BrandedRlp | Encodable[];

const isRlpEncodingError = (e: unknown): e is RlpEncodingError =>
	e instanceof RlpEncodingErrorClass ||
	(e !== null &&
		typeof e === "object" &&
		"name" in e &&
		e.name === "RlpEncodingError");

/**
 * Encodes a variadic list of items to RLP format.
 *
 * @param items - Items to encode
 * @returns Effect that succeeds with RLP-encoded bytes or fails with RlpEncodingError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { encodeVariadic } from 'voltaire-effect/primitives/Rlp'
 *
 * const encoded = Effect.runSync(encodeVariadic(
 *   new Uint8Array([1, 2]),
 *   new Uint8Array([3, 4]),
 *   new Uint8Array([5, 6])
 * ))
 * ```
 *
 * @since 0.0.1
 */
export const encodeVariadic = (
	...items: Encodable[]
): Effect.Effect<Uint8Array, RlpEncodingError> =>
	Effect.try({
		try: () => VoltaireRlp.encodeVariadic(...items),
		catch: (e) =>
			isRlpEncodingError(e)
				? e
				: new RlpEncodingErrorClass("RLP variadic encoding failed", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
