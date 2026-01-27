import { InvalidRangeError } from "@tevm/voltaire/errors";

export function assertPositive(value: number | bigint, name = "value"): void {
	const zero = typeof value == "bigint" ? 0n : 0;
	if (value <= zero) {
		throw new InvalidRangeError(`${name} must be positive`, {
			code: -32602,
			value,
			expected: `${name} > 0`,
			docsPath: "/primitives/validation#assert-positive",
		});
	}
}

export function assertNonNegative(
	value: number | bigint,
	name = "value",
): void {
	const zero = typeof value == "bigint" ? 0n : 0;
	if (value < zero) {
		throw new InvalidRangeError(`${name} cannot be negative`, {
			code: -32602,
			value,
			expected: `${name} >= 0`,
			docsPath: "/primitives/validation#assert-non-negative",
		});
	}
}

export function assertNonZero(value: number | bigint, name = "value"): void {
	const zero = typeof value == "bigint" ? 0n : 0;
	if (value == zero) {
		throw new InvalidRangeError(`${name} cannot be zero`, {
			code: -32602,
			value,
			expected: `${name} !== 0`,
			docsPath: "/primitives/validation#assert-non-zero",
		});
	}
}
