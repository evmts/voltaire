/**
 * @fileoverview PackedUserOperation hash computation for ERC-4337 v0.7.
 *
 * This module computes the hash of a PackedUserOperation as defined in ERC-4337.
 * The hash is used for signature verification and uniquely identifies the
 * PackedUserOperation on a specific chain and EntryPoint.
 *
 * The hash is computed as:
 * `keccak256(keccak256(packedUserOpFields), entryPoint, chainId)`
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @module PackedUserOperation/hash
 * @since 0.0.1
 */

import { Keccak256 } from "@tevm/voltaire";
import type { AddressType } from "@tevm/voltaire/Address";
import { Address } from "@tevm/voltaire/Address";
import { ValidationError } from "@tevm/voltaire/errors";
import * as Effect from "effect/Effect";
import type { PackedUserOperationType } from "./PackedUserOperationSchema.js";

const pad32 = (bytes: Uint8Array): Uint8Array => {
	const result = new Uint8Array(32);
	result.set(bytes, 32 - bytes.length);
	return result;
};

const uint256ToBytes = (n: bigint): Uint8Array => {
	const hex = n.toString(16).padStart(64, "0");
	const bytes = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
};

/**
 * Computes the ERC-4337 user operation hash for signing.
 *
 * The hash is computed as `keccak256(userOpHash, entryPoint, chainId)` where
 * userOpHash is the keccak256 of the packed user operation fields. This is
 * the value that should be signed by the account owner.
 *
 * @description
 * The hash computation for packed operations uses the pre-packed gas fields
 * (accountGasLimits and gasFees) directly, rather than the individual gas
 * values used in the unpacked format.
 *
 * This provides replay protection across chains and EntryPoint versions.
 *
 * @param packedUserOp - The packed user operation to hash
 * @param entryPoint - EntryPoint contract address (accepts string, Uint8Array, or AddressType)
 * @param chainId - Chain ID for replay protection (accepts bigint or number)
 * @returns Effect that succeeds with 32-byte hash or fails with ValidationError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as PackedUserOperation from 'voltaire-effect/primitives/PackedUserOperation'
 *
 * const program = Effect.gen(function* () {
 *   const packed = yield* PackedUserOperation.from({ ... })
 *   const userOpHash = yield* PackedUserOperation.hash(
 *     packed,
 *     '0x0000000071727De22E5E9d8BAf0edAc6f37da032', // v0.7 EntryPoint
 *     1n // mainnet
 *   )
 *   return userOpHash // 32-byte Uint8Array to sign
 * })
 * ```
 *
 * @throws ValidationError - When entryPoint address is invalid
 * @see from - For creating PackedUserOperations
 * @see unpack - For converting to standard UserOperation format
 * @since 0.0.1
 */
export const hash = (
	packedUserOp: PackedUserOperationType,
	entryPoint: number | bigint | string | Uint8Array | AddressType,
	chainId: bigint | number,
): Effect.Effect<Uint8Array, ValidationError> =>
	Effect.try({
		try: () => {
			const entryPointAddr = Address(
				entryPoint as string | number | bigint | Uint8Array,
			);
			const chainIdBigInt =
				typeof chainId === "bigint" ? chainId : BigInt(chainId);
			const chainIdBytes = uint256ToBytes(chainIdBigInt);

			const parts = [
				pad32(packedUserOp.sender),
				uint256ToBytes(packedUserOp.nonce),
				Keccak256.hash(packedUserOp.initCode),
				Keccak256.hash(packedUserOp.callData),
				packedUserOp.accountGasLimits,
				uint256ToBytes(packedUserOp.preVerificationGas),
				packedUserOp.gasFees,
				Keccak256.hash(packedUserOp.paymasterAndData),
			];

			const totalLength = parts.reduce((acc, part) => acc + part.length, 0);
			const packed = new Uint8Array(totalLength);
			let offset = 0;
			for (const part of parts) {
				packed.set(part, offset);
				offset += part.length;
			}

			const userOpHash = Keccak256.hash(packed);

			const finalPacked = new Uint8Array(32 + 20 + 32);
			finalPacked.set(userOpHash, 0);
			finalPacked.set(entryPointAddr, 32);
			finalPacked.set(pad32(chainIdBytes), 52);

			return Keccak256.hash(finalPacked);
		},
		catch: (e) => {
			if (e instanceof ValidationError) return e;
			return new ValidationError(e instanceof Error ? e.message : String(e), {
				value: { packedUserOp, entryPoint, chainId },
				expected: "valid hash inputs",
				cause: e instanceof Error ? e : undefined,
			});
		},
	});
