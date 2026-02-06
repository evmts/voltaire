/**
 * Consume gas from the frame
 * @param {import("../../Frame/FrameType.js").BrandedFrame} frame
 * @param {bigint} amount
 * @returns {import("../../Frame/FrameType.js").EvmError | null}
 */
export function consumeGas(frame, amount) {
	if (frame.gasRemaining < amount) {
		frame.gasRemaining = 0n;
		return { type: "OutOfGas" };
	}
	frame.gasRemaining -= amount;
	return null;
}
