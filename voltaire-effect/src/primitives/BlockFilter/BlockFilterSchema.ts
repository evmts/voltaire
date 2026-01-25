import type { BlockFilter } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";

type BlockFilterType = BlockFilter.BlockFilterType;

const BlockFilterTypeSchema = Schema.declare<BlockFilterType>(
	(u): u is BlockFilterType => {
		if (typeof u !== "object" || u === null) return false;
		return (
			"filterId" in u && "type" in u && (u as BlockFilterType).type === "block"
		);
	},
	{ identifier: "BlockFilter" },
);

/**
 * Effect Schema for validating block filter structures.
 * Validates filterId and type='block' fields.
 *
 * @example
 * ```typescript
 * import { BlockFilterSchema } from 'voltaire-effect/primitives/BlockFilter'
 * import * as Schema from 'effect/Schema'
 *
 * const filter = Schema.decodeSync(BlockFilterSchema)(filterData)
 * ```
 *
 * @since 0.0.1
 */
export const BlockFilterSchema: Schema.Schema<
	BlockFilterType,
	BlockFilterType,
	never
> = Schema.transformOrFail(BlockFilterTypeSchema, BlockFilterTypeSchema, {
	strict: true,
	decode: (t, _options, _ast) => ParseResult.succeed(t),
	encode: (t) => ParseResult.succeed(t),
}).annotations({ identifier: "BlockFilterSchema" });
