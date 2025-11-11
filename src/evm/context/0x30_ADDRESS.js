import { consumeGas } from "../Frame/consumeGas.js";
import { pushStack } from "../Frame/pushStack.js";
import * as Address from "../../primitives/Address/index.js";

/**
 * ADDRESS opcode (0x30) - Get address of currently executing account
 *
 * Stack: [] => [address]
 * Gas: 2 (GasQuickStep)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function address(frame) {
	const gasErr = consumeGas(frame, 2n);
	if (gasErr) return gasErr;

	const addrU256 = Address._toU256(frame.address);
	const pushErr = pushStack(frame, addrU256);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
