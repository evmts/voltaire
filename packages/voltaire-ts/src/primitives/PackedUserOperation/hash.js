import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import * as Address from "../Address/internal-index.js";
import * as Uint from "../Uint/index.js";

/**
 * Compute userOpHash for PackedUserOperation
 *
 * userOpHash = keccak256(abi.encode(packedUserOp, entryPoint, chainId))
 *
 * @param {import('./PackedUserOperationType.js').PackedUserOperationType} packedUserOp - Packed user operation
 * @param {import('../Address/AddressType.js').AddressType | string | number | bigint | Uint8Array} entryPoint - EntryPoint contract address
 * @param {bigint | number} chainId - Chain ID
 * @returns {Uint8Array} 32-byte hash for signing
 *
 * @example
 * ```typescript
 * const hash = PackedUserOperation.hash(packedUserOp, ENTRYPOINT_V07, 1n);
 * const signature = await account.signMessage(hash);
 * ```
 */
export function hash(packedUserOp, entryPoint, chainId) {
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
		pad32(packedUserOp.sender),
		// nonce (uint256)
		Uint.toBytes(packedUserOp.nonce),
		// initCode hash
		keccak256(packedUserOp.initCode),
		// callData hash
		keccak256(packedUserOp.callData),
		// accountGasLimits (bytes32)
		packedUserOp.accountGasLimits,
		// preVerificationGas (uint256)
		Uint.toBytes(packedUserOp.preVerificationGas),
		// gasFees (bytes32)
		packedUserOp.gasFees,
		// paymasterAndData hash
		keccak256(packedUserOp.paymasterAndData),
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
