/**
 * @fileoverview Effect Schema for EVM event signatures (topic 0).
 * @module EventSignature/String
 * @since 0.1.0
 *
 * @description
 * Event signatures are 32-byte keccak256 hashes of event definitions.
 * They appear as topic 0 in event logs and are used to identify event types.
 */

import { EventSignature } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing a 32-byte event topic (keccak256 of event signature).
 * @since 0.1.0
 */
export type EventSignatureType = ReturnType<typeof EventSignature.from>;

/**
 * Input types accepted for creating an EventSignature.
 * @since 0.1.0
 */
export type EventSignatureLike = Parameters<typeof EventSignature.from>[0];

const EventSignatureTypeSchema = S.declare<EventSignatureType>(
	(u): u is EventSignatureType => u instanceof Uint8Array && u.length === 32,
	{ identifier: "EventSignature" },
);

/**
 * Schema for EventSignature from string (signature or hex).
 *
 * @description
 * Transforms event signature strings to EventSignatureType.
 * Accepts event definition strings or hex-encoded 32-byte topics.
 * Encodes to hex string.
 *
 * @example Decoding
 * ```typescript
 * import * as EventSignature from 'voltaire-effect/primitives/EventSignature'
 * import * as S from 'effect/Schema'
 *
 * // From event definition
 * const sig = S.decodeSync(EventSignature.String)('Transfer(address,address,uint256)')
 *
 * // From hex string
 * const fromHex = S.decodeSync(EventSignature.String)('0xddf252ad...')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(EventSignature.String)(sig)
 * ```
 *
 * @since 0.1.0
 */
export const String: S.Schema<EventSignatureType, string> = S.transformOrFail(
	S.String,
	EventSignatureTypeSchema,
	{
		strict: true,
		decode: (value, _options, ast) => {
			try {
				if (value.includes("(")) {
					return ParseResult.succeed(EventSignature.fromSignature(value));
				}
				return ParseResult.succeed(EventSignature.from(value));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (sig) => ParseResult.succeed(EventSignature.toHex(sig)),
	},
).annotations({ identifier: "EventSignature.String" });

export { String as EventSignatureSchema };

/**
 * Converts an EventSignature to hex string.
 *
 * @param sig - The event signature
 * @returns hex string
 * @since 0.1.0
 */
export const toHex = (
	sig: EventSignatureType,
): ReturnType<typeof EventSignature.toHex> => EventSignature.toHex(sig);

/**
 * Compares two event signatures for equality.
 *
 * @param a - First signature
 * @param b - Second signature
 * @returns true if equal
 * @since 0.1.0
 */
export const equals = (a: EventSignatureType, b: EventSignatureType): boolean =>
	EventSignature.equals(a, b);
