import { QuickStep } from "../../primitives/GasConstants/BrandedGasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * NUMBER opcode (0x43) - Get block number
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x43_NUMBER(frame) {
	const gasErr = consumeGas(frame, QuickStep);
	if (gasErr) return gasErr;

	// TODO: Access via block context when available
	// const blockNumber = frame.evm.block_context.block_number;

	// Stub: Use frame property
	const blockNumber = frame.blockNumber ?? 0n;

	const pushErr = pushStack(frame, blockNumber);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
