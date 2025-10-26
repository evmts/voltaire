// Using native TextDecoder + hexToBytes for hex to string conversion
const decoder = new TextDecoder();

// Helper function to convert hex to bytes (inline for benchmark)
function hexToBytes(hex: string): Uint8Array {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

const testData = {
	simple: "0x48656c6c6f2c20576f726c6421", // 'Hello, World!'
	empty: "0x",
	unicode: "0x48656c6c6f20e4b896e7958c20f09f8c8d", // 'Hello 世界 🌍'
	long: `0x${"61".repeat(1000)}`, // 'aaa...'
	ethMessage:
		"0x5369676e2074686973206d65737361676520746f2061757468656e7469636174652", // 'Sign this message to authenticate'
};

export function main(): void {
	decoder.decode(hexToBytes(testData.simple));
	decoder.decode(hexToBytes(testData.empty));
	decoder.decode(hexToBytes(testData.unicode));
	decoder.decode(hexToBytes(testData.long));
	decoder.decode(hexToBytes(testData.ethMessage));
}
