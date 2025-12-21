import { isValidJumpDest } from "../../primitives/Bytecode/isValidJumpDest.js";
import { MidStep } from "../../primitives/GasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";

/**
 * JUMP opcode (0x56) - Unconditional jump
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if operation fails
 */
export function handler_0x56_JUMP(frame) {
	const gasErr = consumeGas(frame, MidStep);
	if (gasErr) return gasErr;

	const { value: dest, error } = popStack(frame);
	if (error) return error;

	// Check if destination fits in u32 range
	if (dest > 0xffffffffn) {
		return { type: "OutOfBounds" };
	}

	const destPc = Number(dest);

	// Validate jump destination
	if (!isValidJumpDest(/** @type {*} */ (frame.bytecode), destPc)) {
		return { type: "InvalidJump" };
	}

	frame.pc = destPc;
	return null;
}
