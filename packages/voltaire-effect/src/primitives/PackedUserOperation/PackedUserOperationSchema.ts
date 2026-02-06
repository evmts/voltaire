/**
 * @fileoverview PackedUserOperation Schema definitions for ERC-4337 v0.7.
 *
 * ERC-4337 v0.7 introduced a packed format for UserOperations that reduces
 * calldata size by combining multiple gas fields into fixed-size byte arrays.
 * This format is more gas-efficient for on-chain processing.
 *
 * The packed format combines:
 * - `accountGasLimits`: verificationGasLimit (16 bytes) + callGasLimit (16 bytes)
 * - `gasFees`: maxPriorityFeePerGas (16 bytes) + maxFeePerGas (16 bytes)
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @module PackedUserOperationSchema
 * @since 0.0.1
 */

import type { AddressType } from "@tevm/voltaire/Address";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { Hex as AddressSchema } from "../Address/Hex.js";

/**
 * Type representing a packed ERC-4337 user operation (v0.7 format).
 *
 * PackedUserOperation is a gas-optimized encoding of UserOperation
 * where multiple gas fields are packed into fixed-size byte arrays.
 * This reduces calldata size and on-chain storage costs.
 *
 * @example
 * ```typescript
 * const packed: PackedUserOperationType = {
 *   sender: addressBytes,
 *   nonce: 0n,
 *   initCode: new Uint8Array(0),
 *   callData: callDataBytes,
 *   accountGasLimits: new Uint8Array(32), // [verificationGasLimit, callGasLimit]
 *   preVerificationGas: 21000n,
 *   gasFees: new Uint8Array(32),          // [maxPriorityFee, maxFee]
 *   paymasterAndData: new Uint8Array(0),
 *   signature: signatureBytes
 * }
 * ```
 *
 * @since 0.0.1
 */
export interface PackedUserOperationType {
	/** Smart contract account address (20 bytes) */
	readonly sender: AddressType;
	/** Account nonce to prevent replay attacks */
	readonly nonce: bigint;
	/** Factory address + init data for account deployment */
	readonly initCode: Uint8Array;
	/** Encoded call data to execute on the account */
	readonly callData: Uint8Array;
	/** Packed verificationGasLimit (16 bytes) + callGasLimit (16 bytes) */
	readonly accountGasLimits: Uint8Array;
	/** Gas to compensate bundler for pre-verification overhead */
	readonly preVerificationGas: bigint;
	/** Packed maxPriorityFeePerGas (16 bytes) + maxFeePerGas (16 bytes) */
	readonly gasFees: Uint8Array;
	/** Paymaster address + verification/post-op data */
	readonly paymasterAndData: Uint8Array;
	/** Signature over the UserOperation hash */
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

const PackedUserOperationSchemaInternal = S.Struct({
	sender: AddressSchema,
	nonce: BigIntFromString,
	initCode: HexStringToBytes,
	callData: HexStringToBytes,
	accountGasLimits: HexStringToBytes,
	preVerificationGas: BigIntFromString,
	gasFees: HexStringToBytes,
	paymasterAndData: HexStringToBytes,
	signature: HexStringToBytes,
});

const PackedUserOperationTypeSchema = S.declare<PackedUserOperationType>(
	(u): u is PackedUserOperationType =>
		typeof u === "object" &&
		u !== null &&
		"sender" in u &&
		"nonce" in u &&
		"accountGasLimits" in u,
	{ identifier: "PackedUserOperation" },
);

/**
 * Input type for PackedUserOperation schema with hex string encoding.
 * @since 0.0.1
 */
export type PackedUserOperationInput = {
	/** Account address as hex string */
	sender: string;
	/** Account nonce as decimal string */
	nonce: string;
	/** Init code for account deployment as hex string */
	initCode: string;
	/** Encoded call data as hex string */
	callData: string;
	/** Packed verificationGasLimit and callGasLimit as hex string */
	accountGasLimits: string;
	/** Pre-verification gas as decimal string */
	preVerificationGas: string;
	/** Packed maxPriorityFeePerGas and maxFeePerGas as hex string */
	gasFees: string;
	/** Paymaster address and data as hex string */
	paymasterAndData: string;
	/** User operation signature as hex string */
	signature: string;
};

/**
 * Effect Schema for validating and transforming PackedUserOperation.
 *
 * Transforms hex-encoded JSON input into PackedUserOperationType with
 * proper Address, bigint, and Uint8Array conversions.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { PackedUserOperationSchema } from 'voltaire-effect/primitives/PackedUserOperation'
 *
 * const packed = S.decodeSync(PackedUserOperationSchema)({
 *   sender: '0x1234567890123456789012345678901234567890',
 *   nonce: '0',
 *   initCode: '0x',
 *   callData: '0x',
 *   accountGasLimits: '0x' + '00'.repeat(32),
 *   preVerificationGas: '21000',
 *   gasFees: '0x' + '00'.repeat(32),
 *   paymasterAndData: '0x',
 *   signature: '0x'
 * })
 * ```
 *
 * @since 0.0.1
 */
export const PackedUserOperationSchema: S.Schema<
	PackedUserOperationType,
	PackedUserOperationInput
> = S.transform(
	PackedUserOperationSchemaInternal,
	PackedUserOperationTypeSchema,
	{
		strict: true,
		decode: (d) => d as PackedUserOperationType,
		encode: (e) => e,
	},
);
