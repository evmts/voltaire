import type { AddressType } from "@tevm/voltaire/Address";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { Hex as AddressSchema } from "../Address/Hex.js";

export type ForwardRequestType = {
	readonly from: AddressType;
	readonly to: AddressType;
	readonly value: bigint;
	readonly gas: bigint;
	readonly nonce: bigint;
	readonly deadline: bigint;
	readonly data: Uint8Array;
};

const ForwardRequestTypeSchema = S.declare<ForwardRequestType>(
	(u): u is ForwardRequestType =>
		u !== null &&
		typeof u === "object" &&
		"from" in u &&
		"to" in u &&
		"value" in u &&
		"data" in u,
	{ identifier: "ForwardRequest" },
);

const HexStringToBytes: S.Schema<Uint8Array, string> = S.transformOrFail(
	S.String,
	S.Uint8ArrayFromSelf,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				const hex = s.startsWith("0x") ? s.slice(2) : s;
				if (hex.length === 0) return ParseResult.succeed(new Uint8Array(0));
				if (hex.length % 2 !== 0) {
					return ParseResult.fail(
						new ParseResult.Type(ast, s, "Invalid hex string length"),
					);
				}
				const bytes = new Uint8Array(hex.length / 2);
				for (let i = 0; i < bytes.length; i++) {
					bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
				}
				return ParseResult.succeed(bytes);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (bytes) => {
			const hex = Array.from(bytes)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
			return ParseResult.succeed(`0x${hex}`);
		},
	},
);

const BigIntFromInput: S.Schema<bigint, bigint | number | string> =
	S.transformOrFail(
		S.Union(S.BigIntFromSelf, S.Number, S.String),
		S.BigIntFromSelf,
		{
			strict: true,
			decode: (s, _options, ast) => {
				try {
					return ParseResult.succeed(BigInt(s));
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, s, (e as Error).message),
					);
				}
			},
			encode: (n) => ParseResult.succeed(n),
		},
	);

export type ForwardRequestInput = {
	readonly from: string;
	readonly to: string;
	readonly value: bigint | number | string;
	readonly gas: bigint | number | string;
	readonly nonce: bigint | number | string;
	readonly deadline: bigint | number | string;
	readonly data: string;
};

export const ForwardRequestSchema: S.Schema<
	ForwardRequestType,
	ForwardRequestInput
> = S.transform(
	S.Struct({
		from: AddressSchema,
		to: AddressSchema,
		value: BigIntFromInput,
		gas: BigIntFromInput,
		nonce: BigIntFromInput,
		deadline: BigIntFromInput,
		data: HexStringToBytes,
	}),
	ForwardRequestTypeSchema,
	{
		strict: true,
		decode: (d) => d as ForwardRequestType,
		encode: (e) => e,
	},
).annotations({ identifier: "ForwardRequestSchema" });
