/**
 * LT opcode (0x10) - Less than comparison (unsigned)
 *
 * Pops two values from stack and pushes 1 if first < second, 0 otherwise.
 * All comparisons are unsigned 256-bit integers.
 *
 * Gas: 3 (GasFastestStep)
 * Stack: a b -> (a < b ? 1 : 0)
 *
 * @param {import("../Frame/BrandedFrame.js").BrandedFrame} frame - Execution frame
 * @returns {import("../Frame/BrandedFrame.js").EvmError | null} Error if operation fails
 */
export function handle(frame) {
	const { FastestStep } = await import(
		"../../primitives/GasConstants/BrandedGasConstants/constants.js"
	);
	const { consumeGas } = await import("../Frame/consumeGas.js");
	const { popStack } = await import("../Frame/popStack.js");
	const { pushStack } = await import("../Frame/pushStack.js");

	// Consume gas
	const gasErr = consumeGas(frame, FastestStep);
	if (gasErr) return gasErr;

	// Pop operands
	const aErr = popStack(frame);
	if (aErr[1]) return aErr[1];
	const a = aErr[0];

	const bErr = popStack(frame);
	if (bErr[1]) return bErr[1];
	const b = bErr[0];

	// Compare: a < b
	const result = a < b ? 1n : 0n;

	// Push result
	const pushErr = pushStack(frame, result);
	if (pushErr) return pushErr;

	// Increment PC
	frame.pc += 1;
	return null;
}
