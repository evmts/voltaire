/**
 * @fileoverview Bundle Schema definitions for ERC-4337 account abstraction.
 *
 * A Bundle is a collection of UserOperations that a Bundler submits to the
 * EntryPoint contract in a single transaction. The Bundle includes the
 * beneficiary address that receives the gas refunds.
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @module BundleSchema
 * @since 0.0.1
 */

import type { AddressType } from "@tevm/voltaire/Address";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { Hex as AddressSchema } from "../Address/Hex.js";
import type {
	UserOperationInput,
	UserOperationType,
} from "../UserOperation/UserOperationSchema.js";

/**
 * Type representing a Bundle of UserOperations.
 *
 * A Bundle contains multiple UserOperations to be submitted together,
 * along with the beneficiary address for gas refunds and the EntryPoint.
 *
 * @since 0.0.1
 */
export type BundleType = {
	readonly userOperations: readonly UserOperationType[];
	readonly beneficiary: AddressType;
	readonly entryPoint: AddressType;
};

const BundleTypeSchema = S.declare<BundleType>(
	(u): u is BundleType =>
		u !== null &&
		typeof u === "object" &&
		"userOperations" in u &&
		"beneficiary" in u &&
		"entryPoint" in u &&
		Array.isArray(u.userOperations),
	{ identifier: "Bundle" },
);

const HexStringToBytes: S.Schema<Uint8Array, string> = S.transformOrFail(
	S.String,
	S.Uint8ArrayFromSelf,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				const hex = s.startsWith("0x") ? s.slice(2) : s;
				if (hex.length === 0) return ParseResult.succeed(new Uint8Array(0));
				if (hex.length % 2 !== 0) {
					return ParseResult.fail(
						new ParseResult.Type(ast, s, "Invalid hex string length"),
					);
				}
				const bytes = new Uint8Array(hex.length / 2);
				for (let i = 0; i < bytes.length; i++) {
					bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
				}
				return ParseResult.succeed(bytes);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (bytes) => {
			const hex = Array.from(bytes)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
			return ParseResult.succeed(`0x${hex}`);
		},
	},
);

const BigIntFromString: S.Schema<bigint, string> = S.transformOrFail(
	S.String,
	S.BigIntFromSelf,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(BigInt(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (n) => ParseResult.succeed(n.toString()),
	},
);

const UserOperationTypeSchema = S.declare<UserOperationType>(
	(u): u is UserOperationType =>
		typeof u === "object" &&
		u !== null &&
		"sender" in u &&
		"nonce" in u &&
		"callData" in u,
	{ identifier: "UserOperation" },
);

const UserOperationSchemaLocal = S.transform(
	S.Struct({
		sender: AddressSchema,
		nonce: BigIntFromString,
		initCode: HexStringToBytes,
		callData: HexStringToBytes,
		callGasLimit: BigIntFromString,
		verificationGasLimit: BigIntFromString,
		preVerificationGas: BigIntFromString,
		maxFeePerGas: BigIntFromString,
		maxPriorityFeePerGas: BigIntFromString,
		paymasterAndData: HexStringToBytes,
		signature: HexStringToBytes,
	}),
	UserOperationTypeSchema,
	{
		strict: true,
		decode: (d) => d as UserOperationType,
		encode: (e) => e,
	},
);

/**
 * Input type for Bundle with string-encoded values.
 *
 * @since 0.0.1
 */
export type BundleInput = {
	/** Array of UserOperations in JSON-RPC format */
	readonly userOperations: readonly UserOperationInput[];
	/** Beneficiary address for gas refunds as hex string */
	readonly beneficiary: string;
	/** EntryPoint contract address as hex string */
	readonly entryPoint: string;
};

/**
 * Effect Schema for validating and transforming Bundles.
 *
 * Transforms JSON-RPC format into native BundleType with proper types.
 *
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { BundleSchema } from 'voltaire-effect/primitives/Bundle'
 *
 * const bundle = Schema.decodeSync(BundleSchema)({
 *   userOperations: [...],
 *   beneficiary: '0x...',
 *   entryPoint: '0x...'
 * })
 * ```
 *
 * @since 0.0.1
 */
export const BundleSchema: S.Schema<BundleType, BundleInput> = S.transform(
	S.Struct({
		userOperations: S.Array(UserOperationSchemaLocal),
		beneficiary: AddressSchema,
		entryPoint: AddressSchema,
	}),
	BundleTypeSchema,
	{
		strict: true,
		decode: (d) => d as BundleType,
		encode: (e) => e,
	},
).annotations({ identifier: "BundleSchema" });
