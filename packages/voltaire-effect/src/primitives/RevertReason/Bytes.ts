/**
 * @fileoverview Schema for RevertReason from bytes.
 * @module RevertReason/Bytes
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
 * Schema for RevertReason from bytes.
 *
 * @description
 * Parses raw byte revert data into typed revert reasons.
 * Supports Error(string), Panic(uint256), Custom errors, and Unknown.
 *
 * @example Decoding
 * ```typescript
 * import * as RevertReason from 'voltaire-effect/primitives/RevertReason'
 * import * as S from 'effect/Schema'
 *
 * const reason = S.decodeSync(RevertReason.Bytes)(revertBytes)
 * if (reason.type === 'Panic') {
 *   console.log(reason.code, reason.description)
 * }
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<RevertReasonType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	RevertReasonTypeSchema as S.Schema<RevertReasonType, RevertReasonType>,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(RevertReason.from(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (reason, _options, _ast) => {
			return ParseResult.succeed(
				new TextEncoder().encode(RevertReason.toString(reason)),
			);
		},
	},
).annotations({ identifier: "RevertReason.Bytes" });
