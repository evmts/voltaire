import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";
import { isValidJumpDest } from "../../primitives/Bytecode/BrandedBytecode/isValidJumpDest.js";
import { SlowStep } from "../../primitives/GasConstants/BrandedGasConstants/constants.js";

/**
 * JUMPI opcode (0x57) - Conditional jump
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handler_0x57_JUMPI(frame) {
	const gasErr = consumeGas(frame, SlowStep);
	if (gasErr) return gasErr;

	const destResult = popStack(frame);
	if (destResult.error) return destResult.error;
	const dest = destResult.value;

	const conditionResult = popStack(frame);
	if (conditionResult.error) return conditionResult.error;
	const condition = conditionResult.value;

	if (condition !== 0n) {
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
	} else {
		frame.pc += 1;
	}

	return null;
}
