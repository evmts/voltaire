import { stringToHex } from "viem/utils";

const testData = {
	simple: "Hello, World!",
	empty: "",
	unicode: "Hello 世界 🌍",
	long: "a".repeat(1000),
	ethMessage: "Sign this message to authenticate",
};

export function main(): void {
	stringToHex(testData.simple);
	stringToHex(testData.empty);
	stringToHex(testData.unicode);
	stringToHex(testData.long);
	stringToHex(testData.ethMessage);
}
