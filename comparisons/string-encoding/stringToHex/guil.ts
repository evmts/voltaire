// Using native TextEncoder + bytesToHex for string to hex conversion
const encoder = new TextEncoder();

// Helper function to convert bytes to hex (inline for benchmark)
function bytesToHex(bytes: Uint8Array): string {
	let hex = '0x';
	for (let i = 0; i < bytes.length; i++) {
		hex += bytes[i].toString(16).padStart(2, '0');
	}
	return hex;
}

const testData = {
	simple: 'Hello, World!',
	empty: '',
	unicode: 'Hello 世界 🌍',
	long: 'a'.repeat(1000),
	ethMessage: 'Sign this message to authenticate',
};

export function main(): void {
	bytesToHex(encoder.encode(testData.simple));
	bytesToHex(encoder.encode(testData.empty));
	bytesToHex(encoder.encode(testData.unicode));
	bytesToHex(encoder.encode(testData.long));
	bytesToHex(encoder.encode(testData.ethMessage));
}
