import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";
import { toU256 } from "../../primitives/Address/BrandedAddress/toU256.js";

/**
 * ORIGIN opcode (0x32) - Get execution origination address
 *
 * Stack: [] => [origin]
 * Gas: 2 (GasQuickStep)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @param {import("../../primitives/Address/BrandedAddress.js").Address} origin - Transaction origin address
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function origin(frame, origin) {
	const gasErr = consumeGas(frame, 2n);
	if (gasErr) return gasErr;

	const originU256 = toU256(origin);
	const pushErr = pushStack(frame, originU256);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
