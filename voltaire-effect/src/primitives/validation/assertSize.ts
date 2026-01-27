import { InvalidSizeError } from "@tevm/voltaire/errors";

export function assertSize(
	data: Uint8Array | string,
	expectedSize: number,
	name = "data",
): void {
	const actualSize = getSize(data);
	if (actualSize !== expectedSize) {
		throw new InvalidSizeError(
			`${name} must be ${expectedSize} bytes, got ${actualSize}`,
			{
				value: data,
				actualSize,
				expectedSize,
			},
		);
	}
}

export function assertMaxSize(
	data: Uint8Array | string,
	maxSize: number,
	name = "data",
): void {
	const actualSize = getSize(data);
	if (actualSize > maxSize) {
		throw new InvalidSizeError(
			`${name} exceeds maximum ${maxSize} bytes, got ${actualSize}`,
			{
				value: data,
				actualSize,
				expectedSize: maxSize,
				context: { constraint: "max" },
			},
		);
	}
}

export function assertMinSize(
	data: Uint8Array | string,
	minSize: number,
	name = "data",
): void {
	const actualSize = getSize(data);
	if (actualSize < minSize) {
		throw new InvalidSizeError(
			`${name} must be at least ${minSize} bytes, got ${actualSize}`,
			{
				value: data,
				actualSize,
				expectedSize: minSize,
				context: { constraint: "min" },
			},
		);
	}
}

function getSize(data: Uint8Array | string): number {
	if (data instanceof Uint8Array) {
		return data.length;
	}
	if (typeof data === "string") {
		const hex = data.startsWith("0x") ? data.slice(2) : data;
		return Math.floor(hex.length / 2);
	}
	return 0;
}
