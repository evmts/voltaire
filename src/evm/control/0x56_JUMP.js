import { isValidJumpDest } from "../../primitives/Bytecode/BrandedBytecode/isValidJumpDest.js";
import { MidStep } from "../../primitives/GasConstants/BrandedGasConstants/constants.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";

/**
 * JUMP opcode (0x56) - Unconditional jump
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
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
	if (!isValidJumpDest(frame.bytecode, destPc)) {
		return { type: "InvalidJump" };
	}

	frame.pc = destPc;
	return null;
}
