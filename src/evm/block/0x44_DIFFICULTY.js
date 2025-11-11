import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";
import { QuickStep } from "../../primitives/GasConstants/BrandedGasConstants/constants.js";

/**
 * DIFFICULTY/PREVRANDAO opcode (0x44) - Get block difficulty or prevrandao
 *
 * Pre-Merge: returns block difficulty
 * Post-Merge: returns prevrandao value
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x44_DIFFICULTY(frame) {
	const gasErr = consumeGas(frame, QuickStep);
	if (gasErr) return gasErr;

	// TODO: Check hardfork and access appropriate field
	// if (frame.evm.hardfork.isAtLeast(.MERGE)) {
	//     value = frame.evm.block_context.block_prevrandao;
	// } else {
	//     value = frame.evm.block_context.block_difficulty;
	// }

	// Stub: Return 0 for now (post-merge default)
	const value = frame.blockDifficulty ?? frame.blockPrevrandao ?? 0n;

	const pushErr = pushStack(frame, value);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
