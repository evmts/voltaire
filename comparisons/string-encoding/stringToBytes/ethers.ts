import { toUtf8Bytes } from "ethers";

const testData = {
	simple: "Hello, World!",
	empty: "",
	unicode: "Hello 世界 🌍",
	long: "a".repeat(1000),
	ethMessage: "Sign this message to authenticate",
};

export function main(): void {
	toUtf8Bytes(testData.simple);
	toUtf8Bytes(testData.empty);
	toUtf8Bytes(testData.unicode);
	toUtf8Bytes(testData.long);
	toUtf8Bytes(testData.ethMessage);
}
