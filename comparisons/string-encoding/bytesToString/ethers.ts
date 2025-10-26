import { toUtf8Bytes, toUtf8String } from "ethers";

const testData = {
	simple: toUtf8Bytes('Hello, World!'),
	empty: toUtf8Bytes(''),
	unicode: toUtf8Bytes('Hello 世界 🌍'),
	long: toUtf8Bytes('a'.repeat(1000)),
	ethMessage: toUtf8Bytes('Sign this message to authenticate'),
};

export function main(): void {
	toUtf8String(testData.simple);
	toUtf8String(testData.empty);
	toUtf8String(testData.unicode);
	toUtf8String(testData.long);
	toUtf8String(testData.ethMessage);
}
