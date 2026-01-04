import { InvalidRangeError } from "../errors/index.js";
import type { EIP1559, EIP2930, EIP4844, EIP7702 } from "./types.js";

/**
 * Validate yParity is exactly 0 or 1
 * @param this Transaction with yParity field
 * @throws {InvalidRangeError} If yParity is not 0 or 1
 */
export function validateYParity(
	this: EIP2930 | EIP1559 | EIP4844 | EIP7702,
): void {
	if (this.yParity !== 0 && this.yParity !== 1) {
		throw new InvalidRangeError("yParity must be 0 or 1", {
			code: "INVALID_Y_PARITY",
			value: this.yParity,
			expected: "0 or 1",
			docsPath: "/primitives/transaction/validate-y-parity#error-handling",
		});
	}
}
