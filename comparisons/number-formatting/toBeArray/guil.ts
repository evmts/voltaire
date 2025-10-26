// Custom bigint to bytes implementation
const testData = 0xabcdef123456789n;

export function main(): void {
	const hex = testData.toString(16);
	const paddedHex = hex.length % 2 === 0 ? hex : `0${hex}`;
	const bytes = new Uint8Array(paddedHex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(paddedHex.slice(i * 2, i * 2 + 2), 16);
	}
}
