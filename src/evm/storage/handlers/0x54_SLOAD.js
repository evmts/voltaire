import {
	ColdSload,
	WarmStorageRead,
} from "../../../primitives/GasConstants/BrandedGasConstants/constants.js";
import * as Frame from "../../Frame/index.js";

/**
 * SLOAD (0x54) - Load word from storage
 *
 * Stack:
 *   in: key
 *   out: value
 *
 * Gas: 100 (warm) or 2100 (cold) - EIP-2929
 *
 * @param {import("../../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @param {import("../../Host/BrandedHost.js").BrandedHost} host - Host interface
 * @returns {import("../../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function sload(frame, host) {
	// Pop key from stack
	const keyResult = Frame.popStack(frame);
	if (keyResult.error) return keyResult.error;
	const key = keyResult.value;

	// TODO: EIP-2929 access list tracking for warm/cold slots
	// For now, assume cold access (worst case)
	const gasCost = ColdSload;

	const gasError = Frame.consumeGas(frame, gasCost);
	if (gasError) return gasError;

	// Load from storage via host
	const value = host.getStorage(frame.address, key);

	// Push value onto stack
	const pushError = Frame.pushStack(frame, value);
	if (pushError) return pushError;

	frame.pc += 1;
	return null;
}
