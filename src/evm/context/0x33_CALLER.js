import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";
import { toU256 } from "../../primitives/Address/BrandedAddress/toU256.js";

/**
 * CALLER opcode (0x33) - Get caller address
 *
 * Stack: [] => [caller]
 * Gas: 2 (GasQuickStep)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function caller(frame) {
	const gasErr = consumeGas(frame, 2n);
	if (gasErr) return gasErr;

	const callerU256 = toU256(frame.caller);
	const pushErr = pushStack(frame, callerU256);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
