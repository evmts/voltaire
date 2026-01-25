/**
 * @fileoverview PackedUserOperation unpacking for ERC-4337 v0.7.
 *
 * This module converts PackedUserOperations back to the standard UserOperation
 * format by extracting the individual gas values from the packed fields.
 *
 * The unpacking extracts:
 * - From `accountGasLimits`: verificationGasLimit (first 16 bytes) + callGasLimit (last 16 bytes)
 * - From `gasFees`: maxPriorityFeePerGas (first 16 bytes) + maxFeePerGas (last 16 bytes)
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @module PackedUserOperation/unpack
 * @since 0.0.1
 */
import { ValidationError } from "@tevm/voltaire/errors";
import * as Effect from "effect/Effect";
import type { UserOperationType } from "../UserOperation/UserOperationSchema.js";
import type { PackedUserOperationType } from "./PackedUserOperationSchema.js";

const bytesToUint128 = (bytes: Uint8Array, offset: number): bigint => {
	let result = 0n;
	for (let i = 0; i < 16; i++) {
		result = (result << 8n) | BigInt(bytes[offset + i] ?? 0);
	}
	return result;
};

/**
 * Unpacks a PackedUserOperation into a full UserOperation.
 *
 * Extracts the packed gas fields (accountGasLimits, gasFees) into
 * their individual components (verificationGasLimit, callGasLimit,
 * maxPriorityFeePerGas, maxFeePerGas).
 *
 * @description
 * This is the inverse of `UserOperation.pack()`. It extracts:
 * - `verificationGasLimit`: First 16 bytes of accountGasLimits
 * - `callGasLimit`: Last 16 bytes of accountGasLimits
 * - `maxPriorityFeePerGas`: First 16 bytes of gasFees
 * - `maxFeePerGas`: Last 16 bytes of gasFees
 *
 * All other fields are copied directly.
 *
 * @param packedUserOp - The packed user operation to unpack
 * @returns Effect that succeeds with UserOperationType or fails with ValidationError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as PackedUserOperation from 'voltaire-effect/primitives/PackedUserOperation'
 *
 * const program = Effect.gen(function* () {
 *   const packed = yield* PackedUserOperation.from({ ... })
 *   const userOp = yield* PackedUserOperation.unpack(packed)
 *   console.log(userOp.callGasLimit)        // extracted from accountGasLimits
 *   console.log(userOp.verificationGasLimit) // extracted from accountGasLimits
 *   console.log(userOp.maxFeePerGas)         // extracted from gasFees
 *   console.log(userOp.maxPriorityFeePerGas) // extracted from gasFees
 * })
 * ```
 *
 * @throws ValidationError - When the packed fields have invalid format
 * @see UserOperation.pack - For the inverse operation
 * @since 0.0.1
 */
export const unpack = (
	packedUserOp: PackedUserOperationType,
): Effect.Effect<UserOperationType, ValidationError> =>
	Effect.try({
		try: () => {
			const verificationGasLimit = bytesToUint128(
				packedUserOp.accountGasLimits,
				0,
			);
			const callGasLimit = bytesToUint128(packedUserOp.accountGasLimits, 16);
			const maxPriorityFeePerGas = bytesToUint128(packedUserOp.gasFees, 0);
			const maxFeePerGas = bytesToUint128(packedUserOp.gasFees, 16);

			return {
				sender: packedUserOp.sender,
				nonce: packedUserOp.nonce,
				initCode: packedUserOp.initCode,
				callData: packedUserOp.callData,
				callGasLimit,
				verificationGasLimit,
				preVerificationGas: packedUserOp.preVerificationGas,
				maxFeePerGas,
				maxPriorityFeePerGas,
				paymasterAndData: packedUserOp.paymasterAndData,
				signature: packedUserOp.signature,
			} as UserOperationType;
		},
		catch: (e) => {
			if (e instanceof ValidationError) return e;
			return new ValidationError(e instanceof Error ? e.message : String(e), {
				value: packedUserOp,
				expected: "valid PackedUserOperation",
				cause: e instanceof Error ? e : undefined,
			});
		},
	});
