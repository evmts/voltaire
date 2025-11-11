import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * CODESIZE opcode (0x38) - Get size of code running in current environment
 *
 * Stack: [] => [size]
 * Gas: 2 (GasQuickStep)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function codesize(frame) {
	const gasErr = consumeGas(frame, 2n);
	if (gasErr) return gasErr;

	const pushErr = pushStack(frame, BigInt(frame.bytecode.length));
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
