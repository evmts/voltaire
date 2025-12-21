import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import * as Address from "../Address/internal-index.js";
import * as Uint from "../Uint/index.js";

/**
 * Compute userOpHash for signing
 *
 * userOpHash = keccak256(abi.encode(userOp, entryPoint, chainId))
 *
 * @param {import('./UserOperationType.js').UserOperationType} userOp - User operation
 * @param {import('../Address/AddressType.js').AddressType | string | number | bigint | Uint8Array} entryPoint - EntryPoint contract address
 * @param {bigint | number} chainId - Chain ID
 * @returns {Uint8Array} 32-byte hash for signing
 *
 * @example
 * ```typescript
 * const hash = UserOperation.hash(userOp, ENTRYPOINT_V06, 1n);
 * const signature = await account.signMessage(hash);
 * ```
 */
export function hash(userOp, entryPoint, chainId) {
	// Pack userOp fields (simplified - actual ERC-4337 uses ABI encoding)
	// For now, we'll concatenate the key fields
	const entryPointAddr = Address.from(entryPoint);
	const chainIdBytes = Uint.toBytes(Uint.from(chainId));

	// Helper to ensure 32-byte padding
	/** @param {Uint8Array} bytes */
	const pad32 = (bytes) => {
		const result = new Uint8Array(32);
		result.set(bytes, 32 - bytes.length);
		return result;
	};

	// Pack all fields with 32-byte alignment (ABI encoding style)
	const parts = [
		// sender (address = 20 bytes, left-padded to 32)
		pad32(userOp.sender),
		// nonce (uint256)
		Uint.toBytes(userOp.nonce),
		// initCode hash
		keccak256(userOp.initCode),
		// callData hash
		keccak256(userOp.callData),
		// callGasLimit
		Uint.toBytes(userOp.callGasLimit),
		// verificationGasLimit
		Uint.toBytes(userOp.verificationGasLimit),
		// preVerificationGas
		Uint.toBytes(userOp.preVerificationGas),
		// maxFeePerGas
		Uint.toBytes(userOp.maxFeePerGas),
		// maxPriorityFeePerGas
		Uint.toBytes(userOp.maxPriorityFeePerGas),
		// paymasterAndData hash
		keccak256(userOp.paymasterAndData),
	];

	// Calculate total length
	const totalLength = parts.reduce((acc, part) => acc + part.length, 0);
	const packed = new Uint8Array(totalLength);
	let offset = 0;
	for (const part of parts) {
		packed.set(part, offset);
		offset += part.length;
	}

	// Hash the packed user operation
	const userOpHash = keccak256(packed);

	// Now pack with entryPoint and chainId
	const finalPacked = new Uint8Array(32 + 20 + 32);
	finalPacked.set(userOpHash, 0);
	finalPacked.set(entryPointAddr, 32);
	finalPacked.set(pad32(chainIdBytes), 52);

	return keccak256(finalPacked);
}
