/**
 * @fileoverview EntryPoint Schema definitions for ERC-4337 account abstraction.
 *
 * The EntryPoint is the central contract in ERC-4337 that handles UserOperation
 * validation and execution. It is a singleton contract deployed at a deterministic
 * address on each chain.
 *
 * This module provides Effect Schema definitions for validating EntryPoint addresses
 * and constants for well-known EntryPoint versions.
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337#entrypoint-definition
 * @module EntryPointSchema
 * @since 0.0.1
 */

import { Address } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Branded type representing an ERC-4337 EntryPoint contract address.
 *
 * The EntryPoint is a singleton contract that handles all UserOperation
 * validation and execution for account abstraction.
 *
 * @example
 * ```typescript
 * import * as EntryPoint from 'voltaire-effect/primitives/EntryPoint'
 *
 * const entryPoint: EntryPointType = Effect.runSync(
 *   EntryPoint.from(EntryPoint.ENTRYPOINT_V07)
 * )
 * ```
 *
 * @since 0.0.1
 */
export type EntryPointType = Uint8Array & { readonly __tag: "EntryPoint" };

const EntryPointTypeSchema = S.declare<EntryPointType>(
	(u): u is EntryPointType => u instanceof Uint8Array && u.length === 20,
	{ identifier: "EntryPoint" },
);

/**
 * Effect Schema for validating ERC-4337 EntryPoint addresses.
 *
 * Accepts hex strings or Uint8Array and returns branded EntryPointType.
 * Validates that the address is exactly 20 bytes.
 *
 * @example
 * ```typescript
 * import * as EntryPoint from 'voltaire-effect/primitives/EntryPoint'
 * import * as Schema from 'effect/Schema'
 *
 * // Parse v0.7 EntryPoint address
 * const entryPoint = Schema.decodeSync(EntryPoint.EntryPointSchema)(
 *   EntryPoint.ENTRYPOINT_V07
 * )
 * ```
 *
 * @throws ParseError - When address format is invalid or not 20 bytes
 * @see EntryPointType - The decoded output type
 * @since 0.0.1
 */
export const EntryPointSchema: S.Schema<EntryPointType, string | Uint8Array> =
	S.transformOrFail(
		S.Union(S.String, S.Uint8ArrayFromSelf),
		EntryPointTypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					if (typeof value === "string") {
						return ParseResult.succeed(
							Address(value) as unknown as EntryPointType,
						);
					}
					if (value.length !== 20) {
						throw new Error("EntryPoint must be exactly 20 bytes");
					}
					return ParseResult.succeed(value as unknown as EntryPointType);
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (entryPoint) =>
				ParseResult.succeed(Address.toHex(entryPoint as any)),
		},
	).annotations({ identifier: "EntryPointSchema" });

/**
 * ERC-4337 EntryPoint v0.6 address.
 *
 * This is the original ERC-4337 EntryPoint deployed across all major networks.
 * Use with UserOperation (unpacked) format.
 *
 * @see https://github.com/eth-infinitism/account-abstraction/releases/tag/v0.6.0
 * @since 0.0.1
 */
export const ENTRYPOINT_V06 = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

/**
 * ERC-4337 EntryPoint v0.7 address.
 *
 * This is the latest ERC-4337 EntryPoint with PackedUserOperation support.
 * Provides gas optimizations through packed gas fields.
 *
 * @see https://github.com/eth-infinitism/account-abstraction/releases/tag/v0.7.0
 * @since 0.0.1
 */
export const ENTRYPOINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
