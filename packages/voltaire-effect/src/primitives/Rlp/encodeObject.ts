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
 * Encodes an object (key-value pairs) to RLP format.
 *
 * @param obj - Object to encode
 * @returns Effect that succeeds with RLP-encoded bytes or fails with RlpEncodingError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { encodeObject } from 'voltaire-effect/primitives/Rlp'
 *
 * const encoded = Effect.runSync(encodeObject({
 *   name: new Uint8Array([65, 66, 67]),
 *   age: new Uint8Array([25])
 * }))
 * ```
 *
 * @since 0.0.1
 */
export const encodeObject = (
	obj: Record<string, Encodable>,
): Effect.Effect<Uint8Array, RlpEncodingError> =>
	Effect.try({
		try: () => VoltaireRlp.encodeObject(obj),
		catch: (e) =>
			isRlpEncodingError(e)
				? e
				: new RlpEncodingErrorClass("RLP object encoding failed", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
