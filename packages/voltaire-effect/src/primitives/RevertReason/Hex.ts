/**
 * @fileoverview Schema for RevertReason from hex-encoded revert data.
 * @module RevertReason/Hex
 * @since 0.1.0
 */

import { RevertReason } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { RevertReasonType } from "./RevertReasonSchema.js";

const ErrorRevertSchema = S.Struct({
	type: S.Literal("Error"),
	message: S.String,
});

const PanicRevertSchema = S.Struct({
	type: S.Literal("Panic"),
	code: S.Number,
	description: S.String,
});

const CustomRevertSchema = S.Struct({
	type: S.Literal("Custom"),
	selector: S.String,
	data: S.Uint8ArrayFromSelf,
});

const UnknownRevertSchema = S.Struct({
	type: S.Literal("Unknown"),
	data: S.Uint8ArrayFromSelf,
});

const RevertReasonTypeSchema = S.Union(
	ErrorRevertSchema,
	PanicRevertSchema,
	CustomRevertSchema,
	UnknownRevertSchema,
);

/**
 * Schema for RevertReason from hex-encoded revert data.
 *
 * @description
 * Parses hex-encoded revert data into typed revert reasons.
 * Supports Error(string), Panic(uint256), Custom errors, and Unknown.
 *
 * @example Decoding
 * ```typescript
 * import * as RevertReason from 'voltaire-effect/primitives/RevertReason'
 * import * as S from 'effect/Schema'
 *
 * const reason = S.decodeSync(RevertReason.Hex)('0x08c379a0...')
 * if (reason.type === 'Error') {
 *   console.log(reason.message)
 * }
 * ```
 *
 * @example Encoding
 * ```typescript
 * const str = S.encodeSync(RevertReason.Hex)(reason)
 * // "Error: Insufficient balance"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<RevertReasonType, string> = S.transformOrFail(
	S.String,
	RevertReasonTypeSchema as S.Schema<RevertReasonType, RevertReasonType>,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(RevertReason.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (reason, _options, _ast) => {
			return ParseResult.succeed(RevertReason.toString(reason));
		},
	},
).annotations({ identifier: "RevertReason.Hex" });
