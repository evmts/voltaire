/**
 * Consume gas from frame
 *
 * @param {import("./BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @param {bigint} amount - Gas amount to consume
 * @returns {import("./BrandedFrame.js").EvmError | null} Error if out of gas
 */
export function consumeGas(frame, amount) {
	if (frame.gasRemaining < amount) {
		frame.gasRemaining = 0n;
		return { type: "OutOfGas" };
	}
	frame.gasRemaining -= amount;
	return null;
}
