/**
 * @fileoverview UserOperation Schema definitions for ERC-4337 account abstraction.
 *
 * ERC-4337 defines a higher-layer pseudo-transaction object called a UserOperation.
 * Users send UserOperation objects into a separate mempool, which bundlers package
 * into a transaction making a `handleOps` call to the EntryPoint contract.
 *
 * This module provides Effect Schema definitions for validating and transforming
 * UserOperation data between JSON-RPC format (hex strings) and native types.
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @module UserOperationSchema
 * @since 0.0.1
 */

import type { AddressType } from "@tevm/voltaire/Address";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { Hex as AddressSchema } from "../Address/Hex.js";

/**
 * Type representing an ERC-4337 UserOperation.
 *
 * A UserOperation contains all the data needed to execute an operation
 * on behalf of a smart contract account, including gas limits, fees,
 * and the actual call data to execute.
 *
 * @since 0.0.1
 */
export interface UserOperationType {
	readonly sender: AddressType;
	readonly nonce: bigint;
	readonly initCode: Uint8Array;
	readonly callData: Uint8Array;
	readonly callGasLimit: bigint;
	readonly verificationGasLimit: bigint;
	readonly preVerificationGas: bigint;
	readonly maxFeePerGas: bigint;
	readonly maxPriorityFeePerGas: bigint;
	readonly paymasterAndData: Uint8Array;
	readonly signature: Uint8Array;
}

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

const UserOperationSchemaInternal = S.Struct({
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
});

const UserOperationTypeSchema = S.declare<UserOperationType>(
	(u): u is UserOperationType =>
		typeof u === "object" &&
		u !== null &&
		"sender" in u &&
		"nonce" in u &&
		"callData" in u,
	{ identifier: "UserOperation" },
);

/**
 * Input type for UserOperation with string-encoded values.
 *
 * This is the JSON-RPC format used when sending UserOperations to bundlers.
 * All numeric values are decimal strings, and all byte arrays are hex strings.
 *
 * @example
 * ```typescript
 * const input: UserOperationInput = {
 *   sender: '0x1234567890123456789012345678901234567890',
 *   nonce: '0',
 *   initCode: '0x',
 *   callData: '0xabcdef',
 *   callGasLimit: '100000',
 *   verificationGasLimit: '100000',
 *   preVerificationGas: '21000',
 *   maxFeePerGas: '1000000000',
 *   maxPriorityFeePerGas: '1000000000',
 *   paymasterAndData: '0x',
 *   signature: '0x...'
 * }
 * ```
 *
 * @since 0.0.1
 */
export type UserOperationInput = {
	/** Smart contract account address as hex string */
	sender: string;
	/** Account nonce as decimal string */
	nonce: string;
	/** Factory address + init data for new accounts, or empty for existing accounts */
	initCode: string;
	/** Encoded call data to execute on the account */
	callData: string;
	/** Gas limit for the main execution call */
	callGasLimit: string;
	/** Gas limit for the account validation phase */
	verificationGasLimit: string;
	/** Gas to compensate bundler for pre-verification overhead */
	preVerificationGas: string;
	/** Maximum fee per gas (EIP-1559) */
	maxFeePerGas: string;
	/** Maximum priority fee per gas (EIP-1559) */
	maxPriorityFeePerGas: string;
	/** Paymaster address + data, or empty for self-sponsored */
	paymasterAndData: string;
	/** Signature over the UserOperation hash */
	signature: string;
};

/**
 * Effect Schema for validating and transforming ERC-4337 UserOperations.
 *
 * Transforms JSON-RPC format (hex strings and decimal strings) into native
 * UserOperationType with proper Address, bigint, and Uint8Array types.
 *
 * @description
 * This schema handles bidirectional transformation between the wire format
 * used by bundler JSON-RPC APIs and the internal representation used for
 * computation and hashing.
 *
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { UserOperationSchema } from 'voltaire-effect/primitives/UserOperation'
 *
 * const userOp = Schema.decodeSync(UserOperationSchema)({
 *   sender: '0x1234567890123456789012345678901234567890',
 *   nonce: '0',
 *   initCode: '0x',
 *   callData: '0xabcdef',
 *   callGasLimit: '100000',
 *   verificationGasLimit: '100000',
 *   preVerificationGas: '21000',
 *   maxFeePerGas: '1000000000',
 *   maxPriorityFeePerGas: '1000000000',
 *   paymasterAndData: '0x',
 *   signature: '0x...'
 * })
 * ```
 *
 * @throws ParseError - When input validation fails (invalid address, hex, etc.)
 * @see UserOperationType - The decoded output type
 * @see UserOperationInput - The encoded input type
 * @since 0.0.1
 */
export const UserOperationSchema: S.Schema<
	UserOperationType,
	UserOperationInput
> = S.transform(UserOperationSchemaInternal, UserOperationTypeSchema, {
	strict: true,
	decode: (d) => d as UserOperationType,
	encode: (e) => e,
});
