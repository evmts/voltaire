import { stringToBytes } from "viem/utils";

const testData = {
	simple: 'Hello, World!',
	empty: '',
	unicode: 'Hello 世界 🌍',
	long: 'a'.repeat(1000),
	ethMessage: 'Sign this message to authenticate',
};

export function main(): void {
	stringToBytes(testData.simple);
	stringToBytes(testData.empty);
	stringToBytes(testData.unicode);
	stringToBytes(testData.long);
	stringToBytes(testData.ethMessage);
}
