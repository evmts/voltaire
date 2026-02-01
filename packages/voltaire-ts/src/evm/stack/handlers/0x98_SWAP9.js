import { FastestStep } from "../../../primitives/GasConstants/constants.js";
import { consumeGas } from "../../Frame/consumeGas.js";

/**
 * SWAP9 opcode (0x98) - Swap top with (9+1)th item
 *
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x98_SWAP9(frame) {
	const gasErr = consumeGas(frame, FastestStep);
	if (gasErr) return gasErr;

	if (frame.stack.length <= 9) {
		return { type: "StackUnderflow" };
	}

	const topIdx = frame.stack.length - 1;
	const swapIdx = frame.stack.length - 1 - 9;
	const temp = /** @type {bigint} */ (frame.stack[topIdx]);
	frame.stack[topIdx] = /** @type {bigint} */ (frame.stack[swapIdx]);
	frame.stack[swapIdx] = temp;

	frame.pc += 1;
	return null;
}
