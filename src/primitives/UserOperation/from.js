import * as Address from "../Address/internal-index.js";
import * as Uint from "../Uint/index.js";

/**
 * Create UserOperation from input object
 *
 * @param {Object} params - UserOperation parameters
 * @param {import('../Address/AddressType.js').AddressType | string | number | bigint | Uint8Array} params.sender - Smart account address
 * @param {import('../Uint/Uint256Type.js').Uint256Type | bigint | number | string} params.nonce - Anti-replay nonce
 * @param {Uint8Array | string} params.initCode - Account initialization code
 * @param {Uint8Array | string} params.callData - Calldata to execute
 * @param {import('../Uint/Uint256Type.js').Uint256Type | bigint | number | string} params.callGasLimit - Gas for execution
 * @param {import('../Uint/Uint256Type.js').Uint256Type | bigint | number | string} params.verificationGasLimit - Gas for verification
 * @param {import('../Uint/Uint256Type.js').Uint256Type | bigint | number | string} params.preVerificationGas - Fixed gas overhead
 * @param {import('../Uint/Uint256Type.js').Uint256Type | bigint | number | string} params.maxFeePerGas - Max total fee per gas
 * @param {import('../Uint/Uint256Type.js').Uint256Type | bigint | number | string} params.maxPriorityFeePerGas - Max priority fee per gas
 * @param {Uint8Array | string} params.paymasterAndData - Paymaster address and data
 * @param {Uint8Array | string} params.signature - Account signature
 * @returns {import('./UserOperationType.js').UserOperationType} UserOperation
 *
 * @example
 * ```typescript
 * const userOp = UserOperation.from({
 *   sender: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
 *   nonce: 0n,
 *   initCode: "0x",
 *   callData: "0x",
 *   callGasLimit: 100000n,
 *   verificationGasLimit: 200000n,
 *   preVerificationGas: 50000n,
 *   maxFeePerGas: 1000000000n,
 *   maxPriorityFeePerGas: 1000000000n,
 *   paymasterAndData: "0x",
 *   signature: "0x",
 * });
 * ```
 */
export function from(params) {
	// Convert hex strings to Uint8Array
	/** @param {Uint8Array | string} value */
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

	return /** @type {import('./UserOperationType.js').UserOperationType} */ ({
		sender: Address.from(params.sender),
		nonce: Uint.from(params.nonce),
		initCode: hexToBytes(params.initCode),
		callData: hexToBytes(params.callData),
		callGasLimit: Uint.from(params.callGasLimit),
		verificationGasLimit: Uint.from(params.verificationGasLimit),
		preVerificationGas: Uint.from(params.preVerificationGas),
		maxFeePerGas: Uint.from(params.maxFeePerGas),
		maxPriorityFeePerGas: Uint.from(params.maxPriorityFeePerGas),
		paymasterAndData: hexToBytes(params.paymasterAndData),
		signature: hexToBytes(params.signature),
	});
}
