import { bytesToString, stringToBytes } from "viem/utils";

const testData = {
	simple: stringToBytes("Hello, World!"),
	empty: stringToBytes(""),
	unicode: stringToBytes("Hello 世界 🌍"),
	long: stringToBytes("a".repeat(1000)),
	ethMessage: stringToBytes("Sign this message to authenticate"),
};

export function main(): void {
	bytesToString(testData.simple);
	bytesToString(testData.empty);
	bytesToString(testData.unicode);
	bytesToString(testData.long);
	bytesToString(testData.ethMessage);
}
