import type { AddressType } from "@tevm/voltaire/Address";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { Hex as AddressSchema } from "../Address/Hex.js";

export type BuilderBidType = {
	readonly builderPubkey: Uint8Array;
	readonly builderAddress: AddressType;
	readonly value: bigint;
	readonly gasLimit: bigint;
	readonly gasUsed: bigint;
	readonly slot: bigint;
	readonly parentHash: Uint8Array;
	readonly blockHash: Uint8Array;
	readonly feeRecipient: AddressType;
	readonly timestamp: bigint;
};

const BuilderBidTypeSchema = S.declare<BuilderBidType>(
	(u): u is BuilderBidType =>
		u !== null &&
		typeof u === "object" &&
		"builderPubkey" in u &&
		"builderAddress" in u &&
		"value" in u &&
		"slot" in u,
	{ identifier: "BuilderBid" },
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

export type BuilderBidInput = {
	readonly builderPubkey: string;
	readonly builderAddress: string;
	readonly value: bigint | number | string;
	readonly gasLimit: bigint | number | string;
	readonly gasUsed: bigint | number | string;
	readonly slot: bigint | number | string;
	readonly parentHash: string;
	readonly blockHash: string;
	readonly feeRecipient: string;
	readonly timestamp: bigint | number | string;
};

export const BuilderBidSchema: S.Schema<BuilderBidType, BuilderBidInput> =
	S.transform(
		S.Struct({
			builderPubkey: HexStringToBytes,
			builderAddress: AddressSchema,
			value: BigIntFromInput,
			gasLimit: BigIntFromInput,
			gasUsed: BigIntFromInput,
			slot: BigIntFromInput,
			parentHash: HexStringToBytes,
			blockHash: HexStringToBytes,
			feeRecipient: AddressSchema,
			timestamp: BigIntFromInput,
		}),
		BuilderBidTypeSchema,
		{
			strict: true,
			decode: (d) => d as BuilderBidType,
			encode: (e) => e,
		},
	).annotations({ identifier: "BuilderBidSchema" });
