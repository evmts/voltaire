import { OSAKA } from "../../primitives/Hardfork/constants.js";
import { isAtLeast } from "../../primitives/Hardfork/isAtLeast.js";

/** CLZ gas cost (EIP-7939: priced like MUL) */
const CLZ_GAS = 5n;

/**
 * CLZ opcode (0x1e) - Count leading zero bits (EIP-7939, Osaka+)
 *
 * Pops `x` and pushes the number of leading zero bits in its 256-bit
 * representation. `clz(0)` is 256.
 *
 * When `frame.hardfork` is set to a fork before Osaka the opcode is invalid.
 * A frame without a hardfork is treated as Osaka or later.
 *
 * @param {import("../Frame/FrameType.js").BrandedFrame} frame - Frame instance
 * @returns {import("../Frame/FrameType.js").EvmError | null} Error if any
 */
export function handle(frame) {
	if (frame.hardfork !== undefined && !isAtLeast(frame.hardfork, OSAKA)) {
		return { type: "InvalidOpcode" };
	}

	// Consume gas (GasFastStep = 5)
	frame.gasRemaining -= CLZ_GAS;
	if (frame.gasRemaining < 0n) {
		frame.gasRemaining = 0n;
		return { type: "OutOfGas" };
	}

	// Pop operand
	if (frame.stack.length < 1) return { type: "StackUnderflow" };
	const value = /** @type {bigint} */ (frame.stack.pop());

	// Bit length of a positive value is the length of its binary string.
	const result = value === 0n ? 256n : BigInt(256 - value.toString(2).length);

	// Push result
	frame.stack.push(result);

	// Increment PC
	frame.pc += 1;

	return null;
}
