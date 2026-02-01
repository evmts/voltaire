import {
	type BrandedRlp,
	type RlpEncodingError,
	RlpEncodingError as RlpEncodingErrorClass,
	Rlp as VoltaireRlp,
} from "@tevm/voltaire/Rlp";
import * as Effect from "effect/Effect";

const isRlpEncodingError = (e: unknown): e is RlpEncodingError =>
	e instanceof RlpEncodingErrorClass ||
	(e !== null &&
		typeof e === "object" &&
		"name" in e &&
		e.name === "RlpEncodingError");

/**
 * Creates an RLP data structure from various inputs.
 *
 * @param value - Uint8Array (bytes), BrandedRlp, or array (list)
 * @returns Effect that succeeds with RLP data structure or fails with RlpEncodingError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from 'voltaire-effect/primitives/Rlp'
 *
 * const rlp = Effect.runSync(from(new Uint8Array([1, 2, 3])))
 * // => { type: 'bytes', value: Uint8Array([1, 2, 3]) }
 * ```
 *
 * @since 0.0.1
 */
export const from = (
	value: Uint8Array | BrandedRlp | BrandedRlp[],
): Effect.Effect<BrandedRlp, RlpEncodingError> =>
	Effect.try({
		try: () => VoltaireRlp.from(value),
		catch: (e) =>
			isRlpEncodingError(e)
				? e
				: new RlpEncodingErrorClass("RLP from failed", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
