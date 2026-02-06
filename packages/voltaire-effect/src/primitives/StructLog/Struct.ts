import { StructLog } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type StructLogType = {
	readonly pc: number;
	readonly op: string;
	readonly gas: bigint;
	readonly gasCost: bigint;
	readonly depth: number;
	readonly stack: readonly string[];
	readonly memory?: readonly string[];
	readonly storage?: Record<string, string>;
	readonly refund?: bigint;
	readonly error?: string;
};

const StructLogTypeSchema = S.declare<StructLogType>(
	(u): u is StructLogType =>
		typeof u === "object" && u !== null && "pc" in u && "op" in u && "gas" in u,
	{ identifier: "StructLog" },
);

/**
 * Effect Schema for validating EVM execution trace logs.
 * StructLogs capture the state at each EVM opcode execution step.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { StructLogSchema } from 'voltaire-effect/primitives/StructLog'
 *
 * const parse = S.decodeSync(StructLogSchema)
 * const log = parse({
 *   pc: 0,
 *   op: 'PUSH1',
 *   gas: 100000n,
 *   gasCost: 3n,
 *   depth: 1,
 *   stack: []
 * })
 * ```
 *
 * @since 0.0.1
 */
export const StructLogSchema: S.Schema<
	StructLogType,
	{
		pc: number;
		op: string;
		gas: bigint;
		gasCost: bigint;
		depth: number;
		stack: readonly string[];
		memory?: readonly string[];
		storage?: Record<string, string>;
		refund?: bigint;
		error?: string;
	}
> = S.transformOrFail(
	S.Struct({
		pc: S.Number,
		op: S.String,
		gas: S.BigIntFromSelf,
		gasCost: S.BigIntFromSelf,
		depth: S.Number,
		stack: S.Array(S.String),
		memory: S.optional(S.Array(S.String)),
		storage: S.optional(S.Record({ key: S.String, value: S.String })),
		refund: S.optional(S.BigIntFromSelf),
		error: S.optional(S.String),
	}),
	StructLogTypeSchema,
	{
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(
					StructLog.from(value as any) as StructLogType,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (log) =>
			ParseResult.succeed({
				pc: log.pc,
				op: log.op,
				gas: log.gas,
				gasCost: log.gasCost,
				depth: log.depth,
				stack: log.stack,
				memory: log.memory,
				storage: log.storage,
				refund: log.refund,
				error: log.error,
			}),
	},
).annotations({ identifier: "StructLogSchema" });
