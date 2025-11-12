import { FastestStep } from "../../../primitives/GasConstants/BrandedGasConstants/constants.js";
import { consumeGas } from "../../Frame/consumeGas.js";

/**
 * SWAP12 opcode (0x9B) - Swap top with (12+1)th item
 *
 * @param {import("../../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x9B_SWAP12(frame) {
	const gasErr = consumeGas(frame, FastestStep);
	if (gasErr) return gasErr;

	if (frame.stack.length <= 12) {
		return { type: "StackUnderflow" };
	}

	const topIdx = frame.stack.length - 1;
	const swapIdx = frame.stack.length - 1 - 12;
	const temp = frame.stack[topIdx];
	frame.stack[topIdx] = frame.stack[swapIdx];
	frame.stack[swapIdx] = temp;

	frame.pc += 1;
	return null;
}
