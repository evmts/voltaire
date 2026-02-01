import { TypedData } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Raw typed data field input
 */
export type TypedDataFieldInput = {
	name: string;
	type: string;
};

/**
 * Raw domain input type (JSON-compatible)
 */
export type DomainInput = {
	name?: string;
	version?: string;
	chainId?: string | number | bigint;
	verifyingContract?: string;
	salt?: string;
};

/**
 * Raw typed data input type (JSON-compatible)
 * EIP-712 structured data
 */
export type TypedDataInput<T = Record<string, unknown>> = {
	types: {
		EIP712Domain: readonly TypedDataFieldInput[];
		[key: string]: readonly TypedDataFieldInput[];
	};
	primaryType: string;
	domain: DomainInput;
	message: T;
};

/**
 * TypedData output type
 */
export type TypedDataOutput<T = Record<string, unknown>> = {
	types: {
		EIP712Domain: readonly TypedDataFieldInput[];
		[key: string]: readonly TypedDataFieldInput[];
	};
	primaryType: string;
	domain: {
		name?: string;
		version?: string;
		chainId?: bigint | number;
		verifyingContract?: Uint8Array;
		salt?: Uint8Array;
	};
	message: T;
};

const TypedDataOutputSchema = S.declare<TypedDataOutput>(
	(u): u is TypedDataOutput => {
		if (typeof u !== "object" || u === null) return false;
		const td = u as Record<string, unknown>;
		return (
			typeof td.types === "object" &&
			typeof td.primaryType === "string" &&
			typeof td.domain === "object" &&
			typeof td.message === "object"
		);
	},
	{ identifier: "TypedData" },
);

const TypedDataFieldInputSchema = S.Struct({
	name: S.String,
	type: S.String,
});

const DomainInputSchema = S.Struct({
	name: S.optional(S.String),
	version: S.optional(S.String),
	chainId: S.optional(S.Union(S.String, S.Number, S.BigIntFromSelf)),
	verifyingContract: S.optional(S.String),
	salt: S.optional(S.String),
});

const TypedDataInputSchema = S.Struct({
	types: S.Record({ key: S.String, value: S.Array(TypedDataFieldInputSchema) }),
	primaryType: S.String,
	domain: DomainInputSchema,
	message: S.Record({ key: S.String, value: S.Unknown }),
});

/**
 * Schema for EIP-712 Typed Data structs.
 *
 * @description
 * Transforms JSON-compatible input to validated TypedData output.
 * Used for EIP-712 typed structured data hashing and signing.
 *
 * @example Decoding
 * ```typescript
 * import * as TypedData from 'voltaire-effect/primitives/TypedData'
 * import * as S from 'effect/Schema'
 *
 * const typedData = S.decodeSync(TypedData.Struct)({
 *   types: {
 *     EIP712Domain: [
 *       { name: 'name', type: 'string' },
 *       { name: 'version', type: 'string' }
 *     ],
 *     Person: [
 *       { name: 'name', type: 'string' },
 *       { name: 'wallet', type: 'address' }
 *     ]
 *   },
 *   primaryType: 'Person',
 *   domain: { name: 'My App', version: '1' },
 *   message: { name: 'Bob', wallet: '0x...' }
 * })
 * ```
 *
 * @since 0.1.0
 */
export const Struct = S.transformOrFail(
	TypedDataInputSchema,
	TypedDataOutputSchema,
	{
		strict: true,
		decode: (input, _options, ast) => {
			try {
				const result = TypedData.from({
					types: input.types,
					primaryType: input.primaryType,
					domain: {
						name: input.domain.name,
						version: input.domain.version,
						chainId:
							input.domain.chainId !== undefined
								? toChainId(input.domain.chainId)
								: undefined,
						verifyingContract: input.domain.verifyingContract,
						salt: input.domain.salt,
					},
					message: input.message,
				} as Parameters<typeof TypedData.from>[0]);
				return ParseResult.succeed(result as unknown as TypedDataOutput);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, input, (e as Error).message),
				);
			}
		},
		encode: (typedData) => {
			const result = {
				types: typedData.types,
				primaryType: typedData.primaryType,
				domain: {
					name: typedData.domain.name,
					version: typedData.domain.version,
					chainId:
						typedData.domain.chainId !== undefined
							? String(typedData.domain.chainId)
							: undefined,
					verifyingContract:
						typedData.domain.verifyingContract !== undefined
							? toHexString(typedData.domain.verifyingContract)
							: undefined,
					salt:
						typedData.domain.salt !== undefined
							? toHexString(typedData.domain.salt)
							: undefined,
				},
				message: typedData.message as Record<string, unknown>,
			};
			return ParseResult.succeed(result);
		},
	},
).annotations({ identifier: "TypedData.Struct" });

export { Struct as TypedDataSchema };

function toChainId(value: string | number | bigint): number | bigint {
	if (typeof value === "bigint") return value;
	if (typeof value === "number") return value;
	if (value.startsWith("0x")) return BigInt(value);
	return Number(value);
}

function toHexString(bytes: Uint8Array): string {
	return (
		"0x" +
		Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	);
}
