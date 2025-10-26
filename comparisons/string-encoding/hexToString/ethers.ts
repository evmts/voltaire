import { getBytes, toUtf8String } from "ethers";

const testData = {
	simple: "0x48656c6c6f2c20576f726c6421", // 'Hello, World!'
	empty: "0x",
	unicode: "0x48656c6c6f20e4b896e7958c20f09f8c8d", // 'Hello 世界 🌍'
	long: `0x${"61".repeat(1000)}`, // 'aaa...'
	ethMessage:
		"0x5369676e2074686973206d65737361676520746f2061757468656e7469636174652", // 'Sign this message to authenticate'
};

export function main(): void {
	toUtf8String(getBytes(testData.simple));
	toUtf8String(getBytes(testData.empty));
	toUtf8String(getBytes(testData.unicode));
	toUtf8String(getBytes(testData.long));
	toUtf8String(getBytes(testData.ethMessage));
}
