import { Withdrawal } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing an EIP-4895 withdrawal.
 * @since 0.0.1
 */
export type WithdrawalType = ReturnType<typeof Withdrawal.from>;

type WithdrawalInput = Parameters<typeof Withdrawal.from>[0];

/**
 * Internal schema declaration for Withdrawal type validation.
 * @since 0.0.1
 */
const WithdrawalTypeSchema = S.declare<WithdrawalType>(
	(u): u is WithdrawalType => {
		if (typeof u !== "object" || u === null) return false;
		return (
			"index" in u && "validatorIndex" in u && "address" in u && "amount" in u
		);
	},
	{ identifier: "Withdrawal" },
);

/**
 * Effect Schema for validating and transforming EIP-4895 withdrawals.
 *
 * Withdrawals represent ETH being withdrawn from the beacon chain to execution layer.
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<WithdrawalType, WithdrawalInput> =
	S.transformOrFail(S.Any, WithdrawalTypeSchema, {
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(Withdrawal.from(value as WithdrawalInput));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (i) => ParseResult.succeed(i as WithdrawalInput),
	}).annotations({ identifier: "WithdrawalSchema" });
