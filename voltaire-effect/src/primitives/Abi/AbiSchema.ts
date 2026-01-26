/**
 * @fileoverview Effect Schema for Ethereum ABI types.
 * Provides comprehensive schema-based parsing and validation for ABI structures.
 *
 * @module Abi/AbiSchema
 * @since 0.1.0
 */

import { Abi } from "@tevm/voltaire/Abi";
import type { Item } from "@tevm/voltaire/Abi";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type alias for Abi instances returned by the Abi factory.
 * @internal
 */
type AbiInstance = ReturnType<typeof Abi>;

// =============================================================================
// StateMutability Schema
// =============================================================================

/**
 * Schema for Solidity state mutability.
 *
 * @since 0.1.0
 */
export const StateMutabilitySchema = S.Union(
	S.Literal("pure"),
	S.Literal("view"),
	S.Literal("nonpayable"),
	S.Literal("payable"),
);

// =============================================================================
// AbiInstance Schema
// =============================================================================

/**
 * Schema for Solidity type strings.
 * Uses S.String for flexibility with array types like "uint256[]" and "address[10]".
 *
 * @since 0.1.0
 */
export const AbiTypeSchema = S.String;

// =============================================================================
// Parameter Schema
// =============================================================================

/**
 * Internal interface for ABI parameters.
 * @internal
 */
interface ParameterInternal {
	readonly type: string;
	readonly name?: string;
	readonly internalType?: string;
	readonly indexed?: boolean;
	readonly components?: readonly ParameterInternal[];
}

/**
 * Schema for ABI parameters (recursive for tuple types).
 *
 * @since 0.1.0
 */
export const ParameterSchema: S.Schema<ParameterInternal> = S.Struct({
	type: S.String,
	name: S.optional(S.String),
	internalType: S.optional(S.String),
	indexed: S.optional(S.Boolean),
	components: S.optional(S.suspend(() => S.Array(ParameterSchema))),
});

// =============================================================================
// Function Schema
// =============================================================================

/**
 * Internal schema for function ABI items.
 * @internal
 */
const FunctionSchemaInternal = S.Struct({
	type: S.Literal("function"),
	name: S.String,
	stateMutability: StateMutabilitySchema,
	inputs: S.Array(ParameterSchema),
	outputs: S.Array(ParameterSchema),
});

/**
 * Type for function items.
 * @internal
 */
type FunctionItem = {
	readonly type: "function";
	readonly name: string;
	readonly stateMutability: "pure" | "view" | "nonpayable" | "payable";
	readonly inputs: readonly ParameterInternal[];
	readonly outputs: readonly ParameterInternal[];
};

/**
 * Type guard schema for function items.
 * @internal
 */
const FunctionTypeSchema = S.declare<FunctionItem>(
	(u): u is FunctionItem =>
		typeof u === "object" &&
		u !== null &&
		"type" in u &&
		u.type === "function",
	{ identifier: "AbiFunction" },
);

/**
 * Schema for function ABI items.
 *
 * @since 0.1.0
 */
export const FunctionSchema: S.Schema<
	FunctionItem,
	S.Schema.Encoded<typeof FunctionSchemaInternal>
> = S.transform(FunctionSchemaInternal, FunctionTypeSchema, {
	strict: true,
	decode: (d) => d as FunctionItem,
	encode: (e) => e,
});

// =============================================================================
// Event Schema
// =============================================================================

/**
 * Internal schema for event ABI items.
 * @internal
 */
const EventSchemaInternal = S.Struct({
	type: S.Literal("event"),
	name: S.String,
	inputs: S.Array(ParameterSchema),
	anonymous: S.optional(S.Boolean),
});

/**
 * Type for event items.
 * @internal
 */
type EventItem = {
	readonly type: "event";
	readonly name: string;
	readonly inputs: readonly ParameterInternal[];
	readonly anonymous?: boolean;
};

/**
 * Type guard schema for event items.
 * @internal
 */
const EventTypeSchema = S.declare<EventItem>(
	(u): u is EventItem =>
		typeof u === "object" && u !== null && "type" in u && u.type === "event",
	{ identifier: "AbiEvent" },
);

/**
 * Schema for event ABI items.
 *
 * @since 0.1.0
 */
export const EventSchema: S.Schema<
	EventItem,
	S.Schema.Encoded<typeof EventSchemaInternal>
> = S.transform(EventSchemaInternal, EventTypeSchema, {
	strict: true,
	decode: (d) => d as EventItem,
	encode: (e) => e,
});

// =============================================================================
// Error Schema
// =============================================================================

/**
 * Internal schema for error ABI items.
 * @internal
 */
const ErrorSchemaInternal = S.Struct({
	type: S.Literal("error"),
	name: S.String,
	inputs: S.Array(ParameterSchema),
});

/**
 * Type for error items.
 * @internal
 */
type ErrorItem = {
	readonly type: "error";
	readonly name: string;
	readonly inputs: readonly ParameterInternal[];
};

/**
 * Type guard schema for error items.
 * @internal
 */
const ErrorTypeSchema = S.declare<ErrorItem>(
	(u): u is ErrorItem =>
		typeof u === "object" && u !== null && "type" in u && u.type === "error",
	{ identifier: "AbiError" },
);

/**
 * Schema for error ABI items.
 *
 * @since 0.1.0
 */
export const ErrorSchema: S.Schema<
	ErrorItem,
	S.Schema.Encoded<typeof ErrorSchemaInternal>
> = S.transform(ErrorSchemaInternal, ErrorTypeSchema, {
	strict: true,
	decode: (d) => d as ErrorItem,
	encode: (e) => e,
});

// =============================================================================
// Constructor Schema
// =============================================================================

/**
 * Internal schema for constructor ABI items.
 * @internal
 */
const ConstructorSchemaInternal = S.Struct({
	type: S.Literal("constructor"),
	stateMutability: StateMutabilitySchema,
	inputs: S.Array(ParameterSchema),
});

/**
 * Type for constructor items.
 * @internal
 */
type ConstructorItem = {
	readonly type: "constructor";
	readonly stateMutability: "pure" | "view" | "nonpayable" | "payable";
	readonly inputs: readonly ParameterInternal[];
};

/**
 * Type guard schema for constructor items.
 * @internal
 */
const ConstructorTypeSchema = S.declare<ConstructorItem>(
	(u): u is ConstructorItem =>
		typeof u === "object" &&
		u !== null &&
		"type" in u &&
		u.type === "constructor",
	{ identifier: "AbiConstructor" },
);

/**
 * Schema for constructor ABI items.
 *
 * @since 0.1.0
 */
export const ConstructorSchema: S.Schema<
	ConstructorItem,
	S.Schema.Encoded<typeof ConstructorSchemaInternal>
> = S.transform(ConstructorSchemaInternal, ConstructorTypeSchema, {
	strict: true,
	decode: (d) => d as ConstructorItem,
	encode: (e) => e,
});

// =============================================================================
// Fallback Schema
// =============================================================================

/**
 * Internal schema for fallback ABI items.
 * @internal
 */
const FallbackSchemaInternal = S.Struct({
	type: S.Literal("fallback"),
	stateMutability: StateMutabilitySchema,
});

/**
 * Type for fallback items.
 * @internal
 */
type FallbackItem = {
	readonly type: "fallback";
	readonly stateMutability: "pure" | "view" | "nonpayable" | "payable";
};

/**
 * Type guard schema for fallback items.
 * @internal
 */
const FallbackTypeSchema = S.declare<FallbackItem>(
	(u): u is FallbackItem =>
		typeof u === "object" &&
		u !== null &&
		"type" in u &&
		u.type === "fallback",
	{ identifier: "AbiFallback" },
);

/**
 * Schema for fallback ABI items.
 *
 * @since 0.1.0
 */
export const FallbackSchema: S.Schema<
	FallbackItem,
	S.Schema.Encoded<typeof FallbackSchemaInternal>
> = S.transform(FallbackSchemaInternal, FallbackTypeSchema, {
	strict: true,
	decode: (d) => d as FallbackItem,
	encode: (e) => e,
});

// =============================================================================
// Receive Schema
// =============================================================================

/**
 * Internal schema for receive ABI items.
 * @internal
 */
const ReceiveSchemaInternal = S.Struct({
	type: S.Literal("receive"),
	stateMutability: S.Literal("payable"),
});

/**
 * Type for receive items.
 * @internal
 */
type ReceiveItem = {
	readonly type: "receive";
	readonly stateMutability: "payable";
};

/**
 * Type guard schema for receive items.
 * @internal
 */
const ReceiveTypeSchema = S.declare<ReceiveItem>(
	(u): u is ReceiveItem =>
		typeof u === "object" &&
		u !== null &&
		"type" in u &&
		u.type === "receive",
	{ identifier: "AbiReceive" },
);

/**
 * Schema for receive ABI items.
 *
 * @since 0.1.0
 */
export const ReceiveSchema: S.Schema<
	ReceiveItem,
	S.Schema.Encoded<typeof ReceiveSchemaInternal>
> = S.transform(ReceiveSchemaInternal, ReceiveTypeSchema, {
	strict: true,
	decode: (d) => d as ReceiveItem,
	encode: (e) => e,
});

// =============================================================================
// Item Schema (Union)
// =============================================================================

/**
 * Internal union schema for all ABI item types.
 * @internal
 */
const ItemSchemaInternal = S.Union(
	FunctionSchemaInternal,
	EventSchemaInternal,
	ErrorSchemaInternal,
	ConstructorSchemaInternal,
	FallbackSchemaInternal,
	ReceiveSchemaInternal,
);

/**
 * Type for any ABI item.
 * @internal
 */
type AbiItemInternal =
	| FunctionItem
	| EventItem
	| ErrorItem
	| ConstructorItem
	| FallbackItem
	| ReceiveItem;

/**
 * Type guard schema for any ABI item.
 * @internal
 */
const ItemTypeSchema = S.declare<AbiItemInternal>(
	(u): u is AbiItemInternal =>
		typeof u === "object" && u !== null && "type" in u,
	{ identifier: "AbiItem" },
);

/**
 * Schema for any ABI item (function, event, error, constructor, fallback, receive).
 *
 * @since 0.1.0
 */
export const ItemSchema: S.Schema<
	AbiItemInternal,
	S.Schema.Encoded<typeof ItemSchemaInternal>
> = S.transform(ItemSchemaInternal, ItemTypeSchema, {
	strict: true,
	decode: (d) => d as AbiItemInternal,
	encode: (e) => e,
});

// =============================================================================
// Abi Schema
// =============================================================================

/**
 * Internal array schema for ABI.
 * @internal
 */
const AbiSchemaInternal = S.Array(ItemSchemaInternal);

/**
 * Type guard schema for validated Abi instances.
 * @internal
 */
const AbiInstanceGuardSchema = S.declare<AbiInstance>(
	(u): u is AbiInstance => Array.isArray(u),
	{ identifier: "Abi" },
);

/**
 * Schema for validated Abi instances.
 * Use this schema to check if a value is already an Abi.
 *
 * @since 0.1.0
 */
export const AbiSchema = AbiInstanceGuardSchema;

/**
 * Schema that parses raw ABI arrays into Abi instances.
 * Use this to validate and construct Abi from unknown input.
 *
 * @example
 * ```typescript
 * import * as Abi from 'voltaire-effect/primitives/Abi'
 * import * as S from 'effect/Schema'
 *
 * const abi = S.decodeUnknownSync(Abi.fromArray)([
 *   { type: 'function', name: 'transfer', stateMutability: 'nonpayable',
 *     inputs: [{ type: 'address', name: 'to' }, { type: 'uint256', name: 'amount' }],
 *     outputs: [{ type: 'bool' }] }
 * ])
 * ```
 *
 * @since 0.1.0
 */
export const fromArray = S.transformOrFail(AbiSchemaInternal, AbiInstanceGuardSchema, {
	strict: true,
	decode: (items, _options, ast) => {
		try {
			return ParseResult.succeed(Abi(items as Parameters<typeof Abi>[0]));
		} catch (e) {
			return ParseResult.fail(
				new ParseResult.Type(ast, items, (e as Error).message),
			);
		}
	},
	encode: (abi, _options, _ast) => {
		return ParseResult.succeed(
			Array.from(abi as unknown as ArrayLike<unknown>) as S.Schema.Encoded<
				typeof AbiSchemaInternal
			>,
		);
	},
}).annotations({ identifier: "Abi.fromArray" });
