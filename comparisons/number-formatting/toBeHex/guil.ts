// Guil implementation - bigint to hex with padding
const testData = 42n;
const width = 32;

export function main(): void {
	const hex = testData.toString(16);
	const paddedHex = hex.padStart(width * 2, "0");
	const result = `0x${paddedHex}`;
}
