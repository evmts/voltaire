// Using native TextDecoder for UTF-8 decoding
const decoder = new TextDecoder();
const encoder = new TextEncoder();

const testData = {
	simple: encoder.encode("Hello, World!"),
	empty: encoder.encode(""),
	unicode: encoder.encode("Hello 世界 🌍"),
	long: encoder.encode("a".repeat(1000)),
	ethMessage: encoder.encode("Sign this message to authenticate"),
};

export function main(): void {
	decoder.decode(testData.simple);
	decoder.decode(testData.empty);
	decoder.decode(testData.unicode);
	decoder.decode(testData.long);
	decoder.decode(testData.ethMessage);
}
