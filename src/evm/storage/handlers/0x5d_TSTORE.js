import * as Frame from "../../Frame/index.js";
import { TStore } from "../../../primitives/GasConstants/BrandedGasConstants/constants.js";

/**
 * TSTORE (0x5d) - Save word to transient storage
 *
 * Stack:
 *   in: key, value
 *   out: -
 *
 * Gas: 100
 *
 * EIP-1153: Transient storage opcodes (Cancun hardfork)
 * - Transaction-scoped storage, cleared at end of transaction
 * - No refunds or complex gas metering
 * - Cannot be called in static context
 *
 * @param {import("../../Frame/BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @param {import("../../Host/BrandedHost.js").BrandedHost} host - Host interface
 * @returns {import("../../Frame/BrandedFrame.js").EvmError | null} Error if any
 */
export function tstore(frame, host) {
	// TODO: Hardfork check - TSTORE requires Cancun+
	// if (hardfork < CANCUN) return { type: "InvalidOpcode" };

	// EIP-1153: Cannot modify transient storage in static call
	if (frame.isStatic) {
		return { type: "WriteProtection" };
	}

	const gasError = Frame.consumeGas(frame, TStore);
	if (gasError) return gasError;

	// Pop key and value from stack
	const keyResult = Frame.popStack(frame);
	if (keyResult.error) return keyResult.error;
	const key = keyResult.value;

	const valueResult = Frame.popStack(frame);
	if (valueResult.error) return valueResult.error;
	const value = valueResult.value;

	// TODO: Store to transient storage
	// For now, stubbed (no-op)
	// Real implementation needs: host.setTransientStorage(frame.address, key, value)

	frame.pc += 1;
	return null;
}
