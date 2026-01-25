import { MemoryDump } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * The MemoryDump type representing EVM memory state.
 * @since 0.0.1
 */
type MemoryDumpType = ReturnType<typeof MemoryDump.from>;

/**
 * Internal schema declaration for MemoryDump type validation.
 * @internal
 */
const MemoryDumpTypeSchema = S.declare<MemoryDumpType>(
	(u): u is MemoryDumpType => {
		if (typeof u !== "object" || u === null) return false;
		const obj = u as Record<string, unknown>;
		return obj.data instanceof Uint8Array && typeof obj.length === "number";
	},
	{ identifier: "MemoryDump" },
);

/**
 * Effect Schema for validating and parsing EVM memory dumps.
 * Memory dumps capture the state of EVM memory during execution or debugging.
 *
 * @param input - A Uint8Array or object with data and optional length
 * @returns The validated MemoryDumpType
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { MemoryDumpSchema } from 'voltaire-effect/MemoryDump'
 *
 * // Parse from Uint8Array
 * const dump = S.decodeSync(MemoryDumpSchema)(new Uint8Array([0, 1, 2, 3]))
 *
 * // Parse from object with explicit length
 * const dumpWithLength = S.decodeSync(MemoryDumpSchema)({
 *   data: new Uint8Array([0, 1, 2, 3]),
 *   length: 4
 * })
 * ```
 *
 * @since 0.0.1
 */
export const MemoryDumpSchema: S.Schema<
	MemoryDumpType,
	Uint8Array | { data: Uint8Array; length?: number }
> = S.transformOrFail(
	S.Union(
		S.Uint8ArrayFromSelf,
		S.Struct({ data: S.Uint8ArrayFromSelf, length: S.optional(S.Number) }),
	),
	MemoryDumpTypeSchema,
	{
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(MemoryDump.from(value));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (dump) => ParseResult.succeed(dump.data),
	},
).annotations({ identifier: "MemoryDumpSchema" });
