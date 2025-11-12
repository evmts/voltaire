import { FastestStep } from "../../../primitives/GasConstants/BrandedGasConstants/constants.js";
import { consumeGas } from "../../Frame/consumeGas.js";

/**
 * SWAP11 opcode (0x9A) - Swap top with (11+1)th item
 *
 * @param {import("../../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x9A_SWAP11(frame) {
	const gasErr = consumeGas(frame, FastestStep);
	if (gasErr) return gasErr;

	if (frame.stack.length <= 11) {
		return { type: "StackUnderflow" };
	}

	const topIdx = frame.stack.length - 1;
	const swapIdx = frame.stack.length - 1 - 11;
	const temp = frame.stack[topIdx];
	frame.stack[topIdx] = frame.stack[swapIdx];
	frame.stack[swapIdx] = temp;

	frame.pc += 1;
	return null;
}
