import { Keccak256 } from "../../crypto/Keccak256/Keccak256.js";
import { fromNumber } from "../../primitives/Address/BrandedAddress/fromNumber.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";
import { pushStack } from "../Frame/pushStack.js";

/**
 * EXTCODEHASH opcode (0x3f) - Get hash of an account's code
 *
 * Stack: [address] => [hash]
 * Gas: Variable (hardfork-dependent: 400/700/2600/100)
 *
 * EIP-1052: Introduced in Constantinople hardfork
 * Returns keccak256 hash of the account's code, or 0 if account is empty.
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @param {import("../Host/BrandedHost.js").BrandedHost} host - Host interface
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function extcodehash(frame, host) {
	// TODO: Add hardfork check for Constantinople+

	const addrResult = popStack(frame);
	if (addrResult.error) return addrResult.error;
	const addrU256 = addrResult.value;

	const addr = fromNumber(addrU256);

	// Gas cost: simplified to 700 (Istanbul)
	// TODO: Add hardfork-aware gas pricing
	const gasErr = consumeGas(frame, 700n);
	if (gasErr) return gasErr;

	// Get the code from the external address
	const code = host.getCode(addr);

	if (code.length === 0) {
		// Return 0 for empty accounts (no code)
		const pushErr = pushStack(frame, 0n);
		if (pushErr) return pushErr;
	} else {
		// Compute keccak256 hash of the code
		const hash = Keccak256.hash(code);

		// Convert hash bytes to u256 (big-endian)
		let hashU256 = 0n;
		for (let i = 0; i < hash.length; i++) {
			hashU256 = (hashU256 << 8n) | BigInt(hash[i]);
		}
		const pushErr = pushStack(frame, hashU256);
		if (pushErr) return pushErr;
	}

	frame.pc += 1;
	return null;
}
