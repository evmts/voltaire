import { SyncStatus } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type SyncProgress = {
	readonly startingBlock: bigint;
	readonly currentBlock: bigint;
	readonly highestBlock: bigint;
	readonly pulledStates?: bigint;
	readonly knownStates?: bigint;
};

type SyncStatusType = false | SyncProgress;

const SyncStatusTypeSchema = S.declare<SyncStatusType>(
	(u): u is SyncStatusType =>
		u === false || (typeof u === "object" && u !== null && "currentBlock" in u),
	{ identifier: "SyncStatus" },
);

const SyncProgressInput = S.Struct({
	startingBlock: S.Union(S.BigIntFromSelf, S.Number, S.String),
	currentBlock: S.Union(S.BigIntFromSelf, S.Number, S.String),
	highestBlock: S.Union(S.BigIntFromSelf, S.Number, S.String),
	pulledStates: S.optional(S.Union(S.BigIntFromSelf, S.Number, S.String)),
	knownStates: S.optional(S.Union(S.BigIntFromSelf, S.Number, S.String)),
});

/**
 * Effect Schema for validating Ethereum node sync status.
 * Returns `false` if synced, or a SyncProgress object if syncing.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { SyncStatusSchema } from 'voltaire-effect/primitives/SyncStatus'
 *
 * const parse = S.decodeSync(SyncStatusSchema)
 * const synced = parse(false)
 * const syncing = parse({
 *   startingBlock: 0n,
 *   currentBlock: 1000n,
 *   highestBlock: 2000n
 * })
 * ```
 *
 * @since 0.0.1
 */
export const SyncStatusSchema: S.Schema<
	SyncStatusType,
	| false
	| {
			startingBlock: bigint | number | string;
			currentBlock: bigint | number | string;
			highestBlock: bigint | number | string;
			pulledStates?: bigint | number | string;
			knownStates?: bigint | number | string;
	  }
> = S.transformOrFail(
	S.Union(S.Literal(false), SyncProgressInput),
	SyncStatusTypeSchema,
	{
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(
					SyncStatus.from(value as any) as SyncStatusType,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (status) => {
			if (status === false) return ParseResult.succeed(false as const);
			const progress = status as SyncProgress;
			return ParseResult.succeed({
				startingBlock: progress.startingBlock,
				currentBlock: progress.currentBlock,
				highestBlock: progress.highestBlock,
				pulledStates: progress.pulledStates,
				knownStates: progress.knownStates,
			});
		},
	},
).annotations({ identifier: "SyncStatusSchema" });
