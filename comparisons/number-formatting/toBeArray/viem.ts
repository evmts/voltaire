import { toBytes } from "viem";

const testData = 0xabcdef123456789n;

export function main(): void {
	const result = toBytes(testData);
}
