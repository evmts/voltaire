import { TokenBalance } from "@tevm/voltaire";

type TokenBalanceType = TokenBalance.TokenBalanceType;

import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const TokenBalanceTypeSchema = S.declare<TokenBalanceType>(
	(u): u is TokenBalanceType =>
		typeof u === "bigint" && u >= 0n && u < 2n ** 256n,
	{ identifier: "TokenBalance" },
);

export const Schema: S.Schema<TokenBalanceType, bigint | number | string> =
	S.transformOrFail(
		S.Union(S.BigIntFromSelf, S.Number, S.String),
		TokenBalanceTypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					return ParseResult.succeed(TokenBalance.from(value));
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (balance) => ParseResult.succeed(TokenBalance.toBigInt(balance)),
		},
	).annotations({ identifier: "TokenBalanceSchema" });

export const FromHexSchema: S.Schema<TokenBalanceType, string> =
	S.transformOrFail(S.String, TokenBalanceTypeSchema, {
		strict: true,
		decode: (hex, _options, ast) => {
			try {
				return ParseResult.succeed(TokenBalance.from(hex));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, hex, (e as Error).message),
				);
			}
		},
		encode: (balance) => ParseResult.succeed(TokenBalance.toHex(balance)),
	}).annotations({ identifier: "TokenBalanceFromHexSchema" });

export type { TokenBalanceType };
