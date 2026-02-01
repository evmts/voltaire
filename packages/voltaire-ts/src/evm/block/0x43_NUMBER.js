import { QuickStep } from "../../primitives/GasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * NUMBER opcode (0x43) - Get block number
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x43_NUMBER(frame) {
	const gasErr = consumeGas(frame, QuickStep);
	if (gasErr) return gasErr;

	// Use block context block number
	const blockNumber = frame.blockNumber ?? 0n;

	const pushErr = pushStack(frame, blockNumber);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
