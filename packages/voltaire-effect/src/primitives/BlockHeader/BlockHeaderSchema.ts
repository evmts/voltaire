import type { BlockHeader } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";

type BlockHeaderType = BlockHeader.BlockHeaderType;

const isUint8Array = (value: unknown): value is Uint8Array =>
	value instanceof Uint8Array;

const isOptionalUint8Array = (
	value: unknown,
): value is Uint8Array | undefined =>
	value === undefined || isUint8Array(value);

const isOptionalBigint = (value: unknown): value is bigint | undefined =>
	value === undefined || typeof value === "bigint";

export const BlockHeaderTypeSchema = Schema.declare<BlockHeaderType>(
	(u): u is BlockHeaderType => {
		if (typeof u !== "object" || u === null) return false;
		const header = u as Record<string, unknown>;
		return (
			"parentHash" in header &&
			isUint8Array(header.parentHash) &&
			"ommersHash" in header &&
			isUint8Array(header.ommersHash) &&
			"beneficiary" in header &&
			isUint8Array(header.beneficiary) &&
			"stateRoot" in header &&
			isUint8Array(header.stateRoot) &&
			"transactionsRoot" in header &&
			isUint8Array(header.transactionsRoot) &&
			"receiptsRoot" in header &&
			isUint8Array(header.receiptsRoot) &&
			"logsBloom" in header &&
			isUint8Array(header.logsBloom) &&
			"difficulty" in header &&
			typeof header.difficulty === "bigint" &&
			"number" in header &&
			typeof header.number === "bigint" &&
			"gasLimit" in header &&
			typeof header.gasLimit === "bigint" &&
			"gasUsed" in header &&
			typeof header.gasUsed === "bigint" &&
			"timestamp" in header &&
			typeof header.timestamp === "bigint" &&
			"extraData" in header &&
			isUint8Array(header.extraData) &&
			"mixHash" in header &&
			isUint8Array(header.mixHash) &&
			"nonce" in header &&
			isUint8Array(header.nonce) &&
			isOptionalBigint(header.baseFeePerGas) &&
			isOptionalUint8Array(header.withdrawalsRoot) &&
			isOptionalBigint(header.blobGasUsed) &&
			isOptionalBigint(header.excessBlobGas) &&
			isOptionalUint8Array(header.parentBeaconBlockRoot)
		);
	},
	{ identifier: "BlockHeader" },
);

/**
 * Effect Schema for validating block header structures.
 * Validates all required header fields and optional post-fork fields when present.
 *
 * @example
 * ```typescript
 * import { BlockHeaderSchema } from 'voltaire-effect/primitives/BlockHeader'
 * import * as Schema from 'effect/Schema'
 *
 * const header = Schema.decodeSync(BlockHeaderSchema)(headerData)
 * ```
 *
 * @since 0.0.1
 */
export const BlockHeaderSchema: Schema.Schema<
	BlockHeaderType,
	BlockHeaderType
> = Schema.transformOrFail(BlockHeaderTypeSchema, BlockHeaderTypeSchema, {
	strict: true,
	decode: (t, _options, _ast) => ParseResult.succeed(t),
	encode: (t) => ParseResult.succeed(t),
}).annotations({ identifier: "BlockHeaderSchema" });
