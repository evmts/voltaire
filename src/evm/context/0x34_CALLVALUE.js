import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * CALLVALUE opcode (0x34) - Get deposited value by instruction/transaction responsible for this execution
 *
 * Stack: [] => [value]
 * Gas: 2 (GasQuickStep)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function callvalue(frame) {
	const gasErr = consumeGas(frame, 2n);
	if (gasErr) return gasErr;

	const pushErr = pushStack(frame, frame.value);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
