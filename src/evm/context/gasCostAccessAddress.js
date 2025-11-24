import { toHex } from "../../primitives/Address/toHex.js";
import {
	ColdAccountAccess,
	WarmStorageRead,
} from "../../primitives/GasConstants/constants.js";

/**
 * Calculate gas cost for account access with warm/cold distinction (EIP-2929)
 *
 * Determines if an address is warm (already accessed in transaction) or cold
 * (first access in transaction). Returns appropriate gas cost based on hardfork.
 *
 * Hardfork-dependent costs:
 * - Berlin+: 2600 (cold) / 100 (warm) - EIP-2929
 * - Istanbul-Berlin: 700 (uniform)
 * - Tangerine Whistle-Istanbul: 400 (uniform, EIP-1884 for BALANCE/EXTCODESIZE)
 * - Pre-Tangerine Whistle: 20 (uniform)
 *
 * @param {import("./FrameType.js").BrandedFrame} frame - Frame with hardfork config
 * @param {import("../Address/AddressType.js").AddressType} address - Address to check
 * @returns {bigint} Gas cost for the access
 */
export function gasCostAccessAddress(frame, address) {
	// Default: Istanbul+ (700 gas uniform)
	if (!frame.hardfork) return 700n;

	const hardfork = frame.hardfork;

	// Berlin+: EIP-2929 warm/cold tracking
	if (hardfork >= "berlin") {
		const addrHex = toHex(address);
		const isWarm = frame.accessedAddresses?.has(addrHex) ?? false;

		// Mark as warm for future references
		if (!frame.accessedAddresses) {
			frame.accessedAddresses = new Set();
		}
		frame.accessedAddresses.add(addrHex);

		return isWarm ? WarmStorageRead : ColdAccountAccess;
	}

	// Istanbul-Berlin: 700 gas (EIP-1884)
	if (hardfork >= "istanbul") {
		return 700n;
	}

	// Tangerine Whistle-Istanbul: 400 gas (EIP-150)
	if (hardfork >= "byzantium") {
		return 400n;
	}

	// Pre-Tangerine Whistle: 20 gas
	return 20n;
}

/**
 * Check if hardfork supports Constantinople or later
 *
 * Used for opcodes introduced in Constantinople (EIP-1052: EXTCODEHASH)
 *
 * @param {import("./FrameType.js").BrandedFrame} frame - Frame with hardfork config
 * @returns {boolean} True if hardfork is Constantinople or later
 */
export function supportsConstantinople(frame) {
	if (!frame.hardfork) return true; // Default to supporting if not specified

	const hardfork = frame.hardfork;
	return hardfork === "constantinople" || hardfork >= "constantinople";
}
