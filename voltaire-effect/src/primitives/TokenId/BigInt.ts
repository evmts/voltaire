import { TokenId } from "@tevm/voltaire";

type TokenIdType = TokenId.TokenIdType;

import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const TokenIdTypeSchema = S.declare<TokenIdType>(
	(u): u is TokenIdType => typeof u === "bigint" && u >= 0n && u < 2n ** 256n,
	{ identifier: "TokenId" },
);

export const Schema: S.Schema<TokenIdType, bigint | number | string> =
	S.transformOrFail(
		S.Union(S.BigIntFromSelf, S.Number, S.String),
		TokenIdTypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					return ParseResult.succeed(TokenId.from(value));
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (tokenId) => ParseResult.succeed(TokenId.toBigInt(tokenId)),
		},
	).annotations({ identifier: "TokenIdSchema" });

export const FromHexSchema: S.Schema<TokenIdType, string> = S.transformOrFail(
	S.String,
	TokenIdTypeSchema,
	{
		strict: true,
		decode: (hex, _options, ast) => {
			try {
				return ParseResult.succeed(TokenId.from(hex));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, hex, (e as Error).message),
				);
			}
		},
		encode: (tokenId) => ParseResult.succeed(TokenId.toHex(tokenId)),
	},
).annotations({ identifier: "TokenIdFromHexSchema" });

export type { TokenIdType };
