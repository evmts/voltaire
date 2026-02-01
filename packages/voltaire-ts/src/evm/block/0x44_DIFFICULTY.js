import { QuickStep } from "../../primitives/GasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * DIFFICULTY/PREVRANDAO opcode (0x44) - Get block difficulty or prevrandao
 *
 * Pre-Merge: returns block difficulty
 * Post-Merge: returns prevrandao value
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x44_DIFFICULTY(frame) {
	const gasErr = consumeGas(frame, QuickStep);
	if (gasErr) return gasErr;

	// Pre-Merge: returns block difficulty
	// Post-Merge: returns prevrandao value (EIP-4399)
	// Use prevrandao if available (post-merge), else difficulty (pre-merge)
	const value = frame.blockPrevrandao ?? frame.blockDifficulty ?? 0n;

	const pushErr = pushStack(frame, value);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
