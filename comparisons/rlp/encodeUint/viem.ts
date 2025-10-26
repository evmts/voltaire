import { toRlp, toHex } from "viem";

// Test data: various uint values
// viem requires hex string format
const testZero = "0x00";
const testSmall = toHex(127);
const testMedium = toHex(1024);
const testLarge = toHex(0xfffffffffn);
const testBigInt = toHex(123456789012345678901234567890n);

export function main(): void {
	toRlp(testZero);
	toRlp(testSmall);
	toRlp(testMedium);
	toRlp(testLarge);
	toRlp(testBigInt);
}
