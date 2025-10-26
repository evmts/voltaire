// Using native TextEncoder for UTF-8 encoding
const encoder = new TextEncoder();

const testData = {
	simple: "Hello, World!",
	empty: "",
	unicode: "Hello 世界 🌍",
	long: "a".repeat(1000),
	ethMessage: "Sign this message to authenticate",
};

export function main(): void {
	encoder.encode(testData.simple);
	encoder.encode(testData.empty);
	encoder.encode(testData.unicode);
	encoder.encode(testData.long);
	encoder.encode(testData.ethMessage);
}
