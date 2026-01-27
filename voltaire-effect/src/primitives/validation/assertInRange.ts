import {
	IntegerOverflowError,
	IntegerUnderflowError,
} from "@tevm/voltaire/errors";

export function assertInRange(
	value: number,
	min: number,
	max: number,
	name: string,
): void {
	if (value < min) {
		throw new IntegerUnderflowError(
			`${name} value ${value} is below minimum ${min}`,
			{
				value,
				min,
				type: name,
			},
		);
	}
	if (value > max) {
		throw new IntegerOverflowError(
			`${name} value ${value} exceeds maximum ${max}`,
			{
				value,
				max,
				type: name,
			},
		);
	}
}

export function assertInRangeBigInt(
	value: bigint,
	min: bigint,
	max: bigint,
	name: string,
): void {
	if (value < min) {
		throw new IntegerUnderflowError(
			`${name} value ${value} is below minimum ${min}`,
			{
				value,
				min,
				type: name,
			},
		);
	}
	if (value > max) {
		throw new IntegerOverflowError(
			`${name} value ${value} exceeds maximum ${max}`,
			{
				value,
				max,
				type: name,
			},
		);
	}
}
