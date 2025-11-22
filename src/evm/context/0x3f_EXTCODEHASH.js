import { Keccak256 } from "../../crypto/Keccak256/Keccak256.js";
import { fromNumber } from "../../primitives/Address/fromNumber.js";
import { consumeGas } from "../Frame/consumeGas.js";
import { popStack } from "../Frame/popStack.js";
import { pushStack } from "../Frame/pushStack.js";
import {
	gasCostAccessAddress,
	supportsConstantinople,
} from "./gasCostAccessAddress.js";

/**
 * EXTCODEHASH opcode (0x3f) - Get hash of an account's code
 *
 * Stack: [address] => [hash]
 *
 * Gas costs vary by hardfork (EIP-1884, EIP-2929):
 * - Constantinople-Istanbul: 400 gas
 * - Istanbul-Berlin: 700 gas (EIP-1884)
 * - Berlin+ (EIP-2929): 2600 gas (cold) / 100 gas (warm)
 *
 * EIP-1052 (Constantinople): Introduces EXTCODEHASH opcode
 * - Returns keccak256 hash of account's code
 * - Returns 0 for non-existent accounts (instead of empty hash)
 * - Can be used for code verification without deploying full code
 *
 * EIP-2929 (Berlin) tracks warm/cold access for state operations.
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @param {import("../Host/HostType.js").BrandedHost} host - Host interface
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function extcodehash(frame, host) {
	// EIP-1052: EXTCODEHASH requires Constantinople hardfork or later
	if (!supportsConstantinople(frame)) {
		return { type: "InvalidOpcode" };
	}

	const addrResult = popStack(frame);
	if (addrResult.error) return addrResult.error;
	const addrU256 = addrResult.value;

	const addr = fromNumber(addrU256);

	// Calculate hardfork-aware gas cost with warm/cold tracking
	const gasCost = gasCostAccessAddress(frame, addr);
	const gasErr = consumeGas(frame, gasCost);
	if (gasErr) return gasErr;

	// Get the code from the external address
	const code = host.getCode(addr);

	if (code.length === 0) {
		// Return 0 for empty accounts (no code)
		// Per EIP-1052: distinguishes empty accounts from code-having accounts
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
