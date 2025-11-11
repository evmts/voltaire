import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";
import { pushStack } from "../Frame/pushStack.js";
import { fromNumber } from "../../primitives/Address/BrandedAddress/fromNumber.js";

/**
 * BALANCE opcode (0x31) - Get balance of an account
 *
 * Stack: [address] => [balance]
 * Gas: Variable (hardfork-dependent: 20/400/700/2600/100)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @param {import("../Host/BrandedHost.js").BrandedHost} host - Host interface
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function balance(frame, host) {
	const addrResult = popStack(frame);
	if (addrResult.error) return addrResult.error;
	const addrU256 = addrResult.value;

	const addr = fromNumber(addrU256);

	// Gas cost: simplified to 700 (Istanbul+)
	// TODO: Add hardfork-aware gas pricing
	const gasErr = consumeGas(frame, 700n);
	if (gasErr) return gasErr;

	const bal = host.getBalance(addr);
	const pushErr = pushStack(frame, bal);
	if (pushErr) return pushErr;

	frame.pc += 1;
	return null;
}
