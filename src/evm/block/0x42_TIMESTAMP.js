import { QuickStep } from "../../primitives/GasConstants/BrandedGasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * TIMESTAMP opcode (0x42) - Get block timestamp
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x42_TIMESTAMP(frame) {
	const gasErr = consumeGas(frame, QuickStep);
	if (gasErr) return gasErr;

	// TODO: Access via block context when available
	// const timestamp = frame.evm.block_context.block_timestamp;

	// Stub: Use current Unix timestamp or frame property
	const timestamp =
		frame.blockTimestamp ?? BigInt(Math.floor(Date.now() / 1000));

	const pushErr = pushStack(frame, timestamp);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
