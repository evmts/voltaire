import { TLoad } from "../../../primitives/GasConstants/BrandedGasConstants/constants.js";
import * as Frame from "../../Frame/index.js";

/**
 * TLOAD (0x5c) - Load word from transient storage
 *
 * Stack:
 *   in: key
 *   out: value
 *
 * Gas: 100
 *
 * EIP-1153: Transient storage opcodes (Cancun hardfork)
 * - Transaction-scoped storage, cleared at end of transaction
 * - No refunds or complex gas metering
 *
 * @param {import("../../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @param {import("../../Host/BrandedHost.js").BrandedHost} host - Host interface
 * @returns {import("../../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function tload(frame, host) {
	// TODO: Hardfork check - TLOAD requires Cancun+
	// if (hardfork < CANCUN) return { type: "InvalidOpcode" };

	const gasError = Frame.consumeGas(frame, TLoad);
	if (gasError) return gasError;

	// Pop key from stack
	const keyResult = Frame.popStack(frame);
	if (keyResult.error) return keyResult.error;
	const key = keyResult.value;

	// TODO: Load from transient storage
	// For now, stub returns 0 (empty)
	// Real implementation needs: host.getTransientStorage(frame.address, key)
	const value = 0n;

	// Push value onto stack
	const pushError = Frame.pushStack(frame, value);
	if (pushError) return pushError;

	frame.pc += 1;
	return null;
}
