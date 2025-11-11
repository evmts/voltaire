import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";
import { pushStack } from "../Frame/pushStack.js";
import * as Address from "../../primitives/Address/index.js";

/**
 * EXTCODESIZE opcode (0x3b) - Get size of an account's code
 *
 * Stack: [address] => [codeSize]
 * Gas: Variable (hardfork-dependent: 20/700/2600/100)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @param {import("../Host/BrandedHost.js").BrandedHost} host - Host interface
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function extcodesize(frame, host) {
	const addrResult = popStack(frame);
	if (addrResult.error) return addrResult.error;
	const addrU256 = addrResult.value;

	const addr = Address._fromU256(addrU256);

	// Gas cost: simplified to 700 (Tangerine Whistle+)
	// TODO: Add hardfork-aware gas pricing
	const gasErr = consumeGas(frame, 700n);
	if (gasErr) return gasErr;

	const code = host.getCode(addr);
	const pushErr = pushStack(frame, BigInt(code.length));
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
