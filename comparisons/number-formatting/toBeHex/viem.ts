import { toHex } from "viem";

const testData = 42n;

export function main(): void {
	const result = toHex(testData, { size: 32 });
}
