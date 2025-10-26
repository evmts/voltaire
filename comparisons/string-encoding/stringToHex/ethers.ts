import { hexlify, toUtf8Bytes } from "ethers";

const testData = {
	simple: "Hello, World!",
	empty: "",
	unicode: "Hello 世界 🌍",
	long: "a".repeat(1000),
	ethMessage: "Sign this message to authenticate",
};

export function main(): void {
	hexlify(toUtf8Bytes(testData.simple));
	hexlify(toUtf8Bytes(testData.empty));
	hexlify(toUtf8Bytes(testData.unicode));
	hexlify(toUtf8Bytes(testData.long));
	hexlify(toUtf8Bytes(testData.ethMessage));
}
