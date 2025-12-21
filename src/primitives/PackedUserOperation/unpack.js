import * as Uint from "../Uint/index.js";

/**
 * Unpack PackedUserOperation (v0.7) to UserOperation (v0.6)
 *
 * Extracts gas limits and fees from packed bytes32 fields.
 *
 * @param {import('./PackedUserOperationType.js').PackedUserOperationType} packedUserOp - Packed user operation v0.7
 * @returns {import('../UserOperation/UserOperationType.js').UserOperationType} User operation v0.6
 *
 * @example
 * ```typescript
 * const userOp = PackedUserOperation.unpack(packedUserOp);
 * ```
 */
export function unpack(packedUserOp) {
	// Unpack accountGasLimits: verificationGasLimit (128 bits) || callGasLimit (128 bits)
	const accountGasLimits = packedUserOp.accountGasLimits;
	let verificationGasLimit = 0n;
	for (let i = 0; i < 16; i++) {
		verificationGasLimit =
			(verificationGasLimit << 8n) | BigInt(/** @type {number} */ (accountGasLimits[i]));
	}

	let callGasLimit = 0n;
	for (let i = 16; i < 32; i++) {
		callGasLimit = (callGasLimit << 8n) | BigInt(/** @type {number} */ (accountGasLimits[i]));
	}

	// Unpack gasFees: maxPriorityFeePerGas (128 bits) || maxFeePerGas (128 bits)
	const gasFees = packedUserOp.gasFees;
	let maxPriorityFeePerGas = 0n;
	for (let i = 0; i < 16; i++) {
		maxPriorityFeePerGas = (maxPriorityFeePerGas << 8n) | BigInt(/** @type {number} */ (gasFees[i]));
	}

	let maxFeePerGas = 0n;
	for (let i = 16; i < 32; i++) {
		maxFeePerGas = (maxFeePerGas << 8n) | BigInt(/** @type {number} */ (gasFees[i]));
	}

	return /** @type {import('../UserOperation/UserOperationType.js').UserOperationType} */ ({
		sender: packedUserOp.sender,
		nonce: packedUserOp.nonce,
		initCode: packedUserOp.initCode,
		callData: packedUserOp.callData,
		callGasLimit: Uint.from(callGasLimit),
		verificationGasLimit: Uint.from(verificationGasLimit),
		preVerificationGas: packedUserOp.preVerificationGas,
		maxFeePerGas: Uint.from(maxFeePerGas),
		maxPriorityFeePerGas: Uint.from(maxPriorityFeePerGas),
		paymasterAndData: packedUserOp.paymasterAndData,
		signature: packedUserOp.signature,
	});
}
