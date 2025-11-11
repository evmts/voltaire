/**
 * Consume gas from frame
 *
 * @param {import("./BrandedFrame.js").BrandedFrame} frame - Frame instance
 * @param {bigint} amount - Gas amount to consume
 * @returns {import("./BrandedFrame.js").EvmError | null} Error if out of gas
 */
export function consumeGas(frame, amount) {
	// Ensure both values are bigint
	const amountBigInt = typeof amount === "bigint" ? amount : BigInt(amount);
	const gasRemaining =
		typeof frame.gasRemaining === "bigint"
			? frame.gasRemaining
			: BigInt(frame.gasRemaining);

	if (gasRemaining < amountBigInt) {
		frame.gasRemaining = 0n;
		return { type: "OutOfGas" };
	}
	frame.gasRemaining = gasRemaining - amountBigInt;
	return null;
}
