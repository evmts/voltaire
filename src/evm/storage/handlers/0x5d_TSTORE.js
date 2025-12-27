import { TStore } from "../../../primitives/GasConstants/constants.js";
import * as Frame from "../../Frame/index.js";

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
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @param {import("../../Host/HostType.js").BrandedHost} host - Host interface
 * @returns {import("../../Frame/FrameType.js").EvmError | null} Error if any
 */
export function tstore(frame, host) {
	// Note: Add hardfork validation - TSTORE requires Cancun+
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

	// Pending host integration: store to transient storage
	// Currently a no-op. Real implementation should call:
	// host.setTransientStorage(frame.address, key, value)

	frame.pc += 1;
	return null;
}
