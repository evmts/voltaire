// Viem implementation - manual bitwise mask operation
const testData = 0xabcdef123456789n;
const bits = 64;

export function main(): void {
	const result = testData & ((1n << BigInt(bits)) - 1n);
}
