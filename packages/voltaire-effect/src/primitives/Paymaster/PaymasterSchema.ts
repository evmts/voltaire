/**
 * @fileoverview Paymaster Schema definitions for ERC-4337 account abstraction.
 *
 * Paymasters are special contracts in ERC-4337 that can sponsor gas fees for
 * UserOperations. They validate and pay for operations on behalf of users,
 * enabling gasless transactions and alternative payment methods.
 *
 * This module provides Effect Schema definitions for validating and transforming
 * Paymaster data between JSON-RPC format and native types.
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337#extension-paymasters
 * @module PaymasterSchema
 * @since 0.0.1
 */

import type { AddressType } from "@tevm/voltaire/Address";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { Hex as AddressSchema } from "../Address/Hex.js";

/**
 * Type representing an ERC-4337 Paymaster configuration.
 *
 * A Paymaster can sponsor UserOperations by paying for gas fees.
 * It includes optional time-based validity constraints.
 *
 * @example
 * ```typescript
 * const paymaster: PaymasterType = {
 *   address: paymasterAddress,
 *   data: verificationData,
 *   validUntil: 1700000000n,
 *   validAfter: 1600000000n
 * }
 * ```
 *
 * @since 0.0.1
 */
export type PaymasterType = {
	readonly address: AddressType;
	readonly data: Uint8Array;
	readonly validUntil?: bigint;
	readonly validAfter?: bigint;
};

const PaymasterTypeSchema = S.declare<PaymasterType>(
	(u): u is PaymasterType =>
		u !== null && typeof u === "object" && "address" in u && "data" in u,
	{ identifier: "Paymaster" },
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

const BigIntFromInput: S.Schema<bigint, bigint | number | string> =
	S.transformOrFail(
		S.Union(S.BigIntFromSelf, S.Number, S.String),
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
			encode: (n) => ParseResult.succeed(n),
		},
	);

/**
 * Input type for Paymaster with string-encoded values.
 *
 * This is the JSON-RPC format used when configuring Paymasters.
 *
 * @example
 * ```typescript
 * const input: PaymasterInput = {
 *   address: '0x1234567890123456789012345678901234567890',
 *   data: '0xabcdef',
 *   validUntil: '1700000000',
 *   validAfter: '1600000000'
 * }
 * ```
 *
 * @since 0.0.1
 */
export type PaymasterInput = {
	/** Paymaster contract address as hex string */
	readonly address: string;
	/** Paymaster-specific verification data as hex string */
	readonly data: string;
	/** Unix timestamp after which the Paymaster approval expires */
	readonly validUntil?: bigint | number | string;
	/** Unix timestamp before which the Paymaster approval is not valid */
	readonly validAfter?: bigint | number | string;
};

/**
 * Effect Schema for validating and transforming ERC-4337 Paymaster configurations.
 *
 * Transforms JSON-RPC format into native PaymasterType with proper
 * Address, bigint, and Uint8Array types.
 *
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { PaymasterSchema } from 'voltaire-effect/primitives/Paymaster'
 *
 * const paymaster = Schema.decodeSync(PaymasterSchema)({
 *   address: '0x1234567890123456789012345678901234567890',
 *   data: '0xabcdef',
 *   validUntil: '1700000000'
 * })
 * ```
 *
 * @throws ParseError - When input validation fails
 * @see PaymasterType - The decoded output type
 * @see PaymasterInput - The encoded input type
 * @since 0.0.1
 */
export const PaymasterSchema: S.Schema<PaymasterType, PaymasterInput> =
	S.transformOrFail(
		S.Struct({
			address: AddressSchema,
			data: HexStringToBytes,
			validUntil: S.optional(BigIntFromInput),
			validAfter: S.optional(BigIntFromInput),
		}),
		PaymasterTypeSchema,
		{
			strict: true,
			decode: (input, _options, ast) => {
				try {
					const result: PaymasterType = {
						address: input.address,
						data: input.data,
					};
					if (input.validUntil !== undefined) {
						(result as any).validUntil = input.validUntil;
					}
					if (input.validAfter !== undefined) {
						(result as any).validAfter = input.validAfter;
					}
					return ParseResult.succeed(result);
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, input, (e as Error).message),
					);
				}
			},
			encode: (state) =>
				ParseResult.succeed({
					address: state.address,
					data: state.data,
					validUntil: state.validUntil,
					validAfter: state.validAfter,
				}),
		},
	).annotations({ identifier: "PaymasterSchema" });
