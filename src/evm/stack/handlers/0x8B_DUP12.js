import { consumeGas } from "../../Frame/consumeGas.js";
import { pushStack } from "../../Frame/pushStack.js";
import { FastestStep } from "../../../primitives/GasConstants/BrandedGasConstants/constants.js";

/**
 * DUP12 opcode (0x8B) - Duplicate 12th stack item
 *
 * @param {import("../../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x8B_DUP12(frame) {
	const gasErr = consumeGas(frame, FastestStep);
	if (gasErr) return gasErr;

	if (frame.stack.length < 12) {
		return { type: "StackUnderflow" };
	}

	const value = frame.stack[frame.stack.length - 12];
	const pushErr = pushStack(frame, value);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
