import * as MaxPriorityFeePerGas from "../../../primitives/MaxPriorityFeePerGas/index.js";

// Valid ways to create priority fees
const validTip1 = MaxPriorityFeePerGas.from(2000000000n); // bigint Wei
const validTip2 = MaxPriorityFeePerGas.from(1000000000); // number Wei
const validTip3 = MaxPriorityFeePerGas.from("0x77359400"); // hex string
const validTip4 = MaxPriorityFeePerGas.fromGwei(2n); // bigint Gwei
const validTip5 = MaxPriorityFeePerGas.fromGwei(2); // number Gwei
const validTip6 = MaxPriorityFeePerGas.fromWei(2000000000n); // Wei constructor
const zero = MaxPriorityFeePerGas.from(0n);
const verySmall = MaxPriorityFeePerGas.from(1n); // 1 Wei
const veryLarge = MaxPriorityFeePerGas.fromGwei(1000); // 1000 Gwei

try {
	MaxPriorityFeePerGas.from(-1n);
} catch (e) {}

try {
	MaxPriorityFeePerGas.from(1.5);
} catch (e) {}

try {
	MaxPriorityFeePerGas.from("2000000000");
} catch (e) {}

try {
	// @ts-expect-error - Testing invalid type
	MaxPriorityFeePerGas.from({ value: 1000000000n });
} catch (e) {}

function isValidPriorityFee(value: unknown): boolean {
	try {
		if (
			typeof value === "bigint" ||
			typeof value === "number" ||
			typeof value === "string"
		) {
			MaxPriorityFeePerGas.from(value as bigint | number | string);
			return true;
		}
		return false;
	} catch {
		return false;
	}
}

const testValues = [
	2000000000n,
	1000000000,
	"0x77359400",
	-1n,
	1.5,
	"2000000000",
	null,
	undefined,
];

for (const value of testValues) {
}
