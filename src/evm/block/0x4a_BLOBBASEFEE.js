import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";
import { QuickStep } from "../../primitives/GasConstants/BrandedGasConstants/constants.js";

/**
 * BLOBBASEFEE opcode (0x4a) - Get blob base fee (EIP-7516, Cancun+)
 *
 * Per Python reference (cancun/vm/gas.py and BlobBaseFeeGas constant):
 * - GAS_BASE = 2 (same as GasQuickStep)
 * - Returns blob_base_fee calculated from excess_blob_gas
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x4a_BLOBBASEFEE(frame) {
	// TODO: Check hardfork when available
	// if (frame.evm.hardfork.isBefore(.CANCUN)) return { type: "InvalidOpcode" };

	const gasErr = consumeGas(frame, QuickStep);
	if (gasErr) return gasErr;

	// TODO: Access via block context when available
	// const blobBaseFee = frame.evm.block_context.blob_base_fee;

	// Stub: Use frame property or default (1 wei minimum)
	const blobBaseFee = frame.blobBaseFee ?? 1n;

	const pushErr = pushStack(frame, blobBaseFee);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
