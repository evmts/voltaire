import type { BlockHeader } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";

type BlockHeaderType = BlockHeader.BlockHeaderType;

const BlockHeaderTypeSchema = Schema.declare<BlockHeaderType>(
	(u): u is BlockHeaderType => {
		if (typeof u !== "object" || u === null) return false;
		return "parentHash" in u && "stateRoot" in u && "number" in u;
	},
	{ identifier: "BlockHeader" },
);

/**
 * Effect Schema for validating block header structures.
 * Validates required fields: parentHash, stateRoot, number.
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
