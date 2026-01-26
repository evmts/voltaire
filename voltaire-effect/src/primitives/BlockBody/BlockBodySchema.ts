import type { BlockBody } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";

type BlockBodyType = BlockBody.BlockBodyType;

/**
 * Validates a withdrawal object has required fields with correct types.
 * @internal
 */
const isValidWithdrawal = (w: unknown): boolean => {
	if (typeof w !== "object" || w === null) return false;
	const withdrawal = w as Record<string, unknown>;

	// Check index is bigint
	if (!("index" in withdrawal) || typeof withdrawal.index !== "bigint")
		return false;

	// Check validatorIndex is bigint
	if (
		!("validatorIndex" in withdrawal) ||
		typeof withdrawal.validatorIndex !== "bigint"
	)
		return false;

	// Check address is 20-byte Uint8Array
	if (
		!("address" in withdrawal) ||
		!(withdrawal.address instanceof Uint8Array) ||
		withdrawal.address.length !== 20
	)
		return false;

	// Check amount is bigint
	if (!("amount" in withdrawal) || typeof withdrawal.amount !== "bigint")
		return false;

	return true;
};

const BlockBodyTypeSchema = Schema.declare<BlockBodyType>(
	(u): u is BlockBodyType => {
		if (typeof u !== "object" || u === null) return false;
		const body = u as Record<string, unknown>;

		// Check required fields exist and are arrays
		if (!("transactions" in body) || !Array.isArray(body.transactions))
			return false;
		if (!("ommers" in body) || !Array.isArray(body.ommers)) return false;

		// Validate withdrawals array if present (post-Shanghai)
		if ("withdrawals" in body && body.withdrawals !== undefined) {
			if (!Array.isArray(body.withdrawals)) return false;

			// Validate each withdrawal object
			for (const withdrawal of body.withdrawals) {
				if (!isValidWithdrawal(withdrawal)) return false;
			}
		}

		return true;
	},
	{ identifier: "BlockBody" },
);

/**
 * Effect Schema for validating block body structures.
 * Validates transactions and ommers fields.
 *
 * @example
 * ```typescript
 * import { BlockBodySchema } from 'voltaire-effect/primitives/BlockBody'
 * import * as Schema from 'effect/Schema'
 *
 * const body = Schema.decodeSync(BlockBodySchema)(bodyData)
 * ```
 *
 * @since 0.0.1
 */
export const BlockBodySchema: Schema.Schema<BlockBodyType, BlockBodyType> =
	Schema.transformOrFail(BlockBodyTypeSchema, BlockBodyTypeSchema, {
		strict: true,
		decode: (t, _options, _ast) => ParseResult.succeed(t),
		encode: (t) => ParseResult.succeed(t),
	}).annotations({ identifier: "BlockBodySchema" });
