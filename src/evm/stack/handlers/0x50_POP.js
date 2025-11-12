import { FastestStep } from "../../../primitives/GasConstants/BrandedGasConstants/constants.js";
import { consumeGas } from "../../Frame/consumeGas.js";
import { popStack } from "../../Frame/popStack.js";

/**
 * POP opcode (0x50) - Remove top item from stack
 *
 * @param {import("../../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x50_POP(frame) {
	const gasErr = consumeGas(frame, FastestStep);
	if (gasErr) return gasErr;

	const { error } = popStack(frame);
	if (error) return error;

	frame.pc += 1;
	return null;
}
