// Guil implementation - strip leading zeros for JSON-RPC format
const testData = 0x00000042n;

export function main(): void {
	const hex = testData.toString(16);
	const result = `0x${hex}`;
}
