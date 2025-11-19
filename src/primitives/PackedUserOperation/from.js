import * as Address from "../Address/internal-index.js";
import * as Uint from "../Uint/index.js";

/**
 * Create PackedUserOperation from input object
 *
 * @param {Object} params - PackedUserOperation parameters
 * @param {import('../Address/AddressType.js').AddressType | string | number | bigint | Uint8Array} params.sender - Smart account address
 * @param {import('../Uint/Uint256Type.js').Uint256Type | bigint | number | string} params.nonce - Anti-replay nonce
 * @param {Uint8Array | string} params.initCode - Account initialization code
 * @param {Uint8Array | string} params.callData - Calldata to execute
 * @param {Uint8Array | string} params.accountGasLimits - Packed gas limits (32 bytes)
 * @param {import('../Uint/Uint256Type.js').Uint256Type | bigint | number | string} params.preVerificationGas - Fixed gas overhead
 * @param {Uint8Array | string} params.gasFees - Packed gas fees (32 bytes)
 * @param {Uint8Array | string} params.paymasterAndData - Paymaster address and data
 * @param {Uint8Array | string} params.signature - Account signature
 * @returns {import('./PackedUserOperationType.js').PackedUserOperationType} PackedUserOperation
 *
 * @example
 * ```typescript
 * const packedUserOp = PackedUserOperation.from({
 *   sender: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
 *   nonce: 0n,
 *   initCode: "0x",
 *   callData: "0x",
 *   accountGasLimits: "0x...", // 32 bytes
 *   preVerificationGas: 50000n,
 *   gasFees: "0x...", // 32 bytes
 *   paymasterAndData: "0x",
 *   signature: "0x",
 * });
 * ```
 */
export function from(params) {
	// Convert hex strings to Uint8Array
	const hexToBytes = (value) => {
		if (typeof value === "string") {
			const hex = value.startsWith("0x") ? value.slice(2) : value;
			if (hex.length === 0) return new Uint8Array(0);
			const bytes = new Uint8Array(hex.length / 2);
			for (let i = 0; i < bytes.length; i++) {
				bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
			}
			return bytes;
		}
		return value;
	};

	return /** @type {import('./PackedUserOperationType.js').PackedUserOperationType} */ ({
		sender: Address.from(params.sender),
		nonce: Uint.from(params.nonce),
		initCode: hexToBytes(params.initCode),
		callData: hexToBytes(params.callData),
		accountGasLimits: hexToBytes(params.accountGasLimits),
		preVerificationGas: Uint.from(params.preVerificationGas),
		gasFees: hexToBytes(params.gasFees),
		paymasterAndData: hexToBytes(params.paymasterAndData),
		signature: hexToBytes(params.signature),
	});
}
