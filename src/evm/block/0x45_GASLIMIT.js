import { QuickStep } from "../../primitives/GasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * GASLIMIT opcode (0x45) - Get block gas limit
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x45_GASLIMIT(frame) {
	const gasErr = consumeGas(frame, QuickStep);
	if (gasErr) return gasErr;

	// Use block context gas limit (defaults to 30M if not set)
	const gasLimit = frame.blockGasLimit ?? 30_000_000n;

	const pushErr = pushStack(frame, gasLimit);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
